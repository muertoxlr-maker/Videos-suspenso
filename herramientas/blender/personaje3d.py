"""Personaje 3D estilo caricatura (toon) con el cuerpo base de MPFB2/MakeHuman (CC0) y Blender.

Uso (sin pantalla):
  blender -b --python herramientas/blender/personaje3d.py -- receta.json salida_prefijo [angulos=-25,-12,0]

La receta (JSON) dice qué ajustes de MakeHuman aplicar y con qué peso, los colores y el encuadre:
  {"targets": {"macrodetails/african-male-young": 1.0, "nose/nose-scale-horiz-incr": 0.6, ...},
   "piel": ["#3e1c0b", "#5d2f18", "#7a4426", "#8b502b", "#a86f4c"], "pelo": "#120b08", "labio": "#7a3a2a",
   "contorno": 0.004, "camara": {"y": 15.2, "dist": 6.5, "lente": 85}}

Sale un PNG por ángulo (fondo transparente) para montarlo encima de los fondos en Remotion.
"""
import gzip
import json
import math
import os
import sys

import bpy
from mathutils import Vector

MPFB = os.environ.get("MPFB_DATA", "/home/user/makehumancommunity/mpfb2/src/mpfb/data")
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
receta = json.load(open(args[0]))
prefijo = args[1]
angulos = [float(a) for a in (args[2] if len(args) > 2 else "-25,-12,0").split(",")]


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)) + (1.0,)


# ── 1) leer la malla base (vértices, UV, caras por grupo) ──
V, VT, caras = [], [], {}
grupo = "body"
for linea in open(os.path.join(MPFB, "3dobjs", "base.obj")):
    if linea.startswith("v "):
        V.append([float(x) for x in linea.split()[1:4]])
    elif linea.startswith("vt "):
        VT.append([float(x) for x in linea.split()[1:3]])
    elif linea.startswith("g "):
        grupo = linea.split()[1]
    elif linea.startswith("f "):
        f = [p.split("/") for p in linea.split()[1:]]
        caras.setdefault(grupo, []).append(([int(p[0]) - 1 for p in f], [int(p[1]) - 1 if len(p) > 1 and p[1] else 0 for p in f]))

# ── 2) aplicar los ajustes (targets) ──
for nombre, peso in receta.get("targets", {}).items():
    ruta = os.path.join(MPFB, "targets", nombre + ".target.gz")
    if not os.path.exists(ruta):
        print("NO EXISTE", nombre)
        continue
    for linea in gzip.open(ruta, "rt"):
        if not linea.strip() or linea.startswith("#"):
            continue
        p = linea.split()
        i = int(p[0])
        V[i][0] += peso * float(p[1]); V[i][1] += peso * float(p[2]); V[i][2] += peso * float(p[3])


def malla(nombre, grupos):
    fs = [c for g in grupos for c in caras.get(g, [])]
    usados = sorted({i for c, _ in fs for i in c})
    nuevo = {v: k for k, v in enumerate(usados)}
    # MakeHuman: Y arriba → Blender: Z arriba
    vs = [(V[i][0], -V[i][2], V[i][1]) for i in usados]
    me = bpy.data.meshes.new(nombre)
    me.from_pydata(vs, [], [[nuevo[i] for i in c] for c, _ in fs])
    uv = me.uv_layers.new(name="UV")
    k = 0
    for (c, t) in fs:
        for ti in t:
            uv.data[k].uv = VT[ti]
            k += 1
    if nombre == "cuerpo":
        at = me.color_attributes.new("zona", "FLOAT_COLOR", "POINT")
        for k, i in enumerate(usados):
            z = ZONA.get(i, (0.0, 0.0))
            at.data[k].color = (z[0], z[1], 0.0, 1.0)
    me.update()
    ob = bpy.data.objects.new(nombre, me)
    bpy.context.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    return ob, usados


# ── 2b) zonas de la cara por posición (pelo al rape, cejas, bigote, perilla, camiseta) ──
GR = json.load(open(os.path.join(MPFB, "mesh_metadata", "basemesh_vertex_groups.json")))
def idxs(g):
    return [i for a, b in GR[g] for i in range(a, b + 1)]
def centro(g):
    ii = idxs(g)
    return [sum(V[i][k] for i in ii) / len(ii) for k in range(3)]
OJO_L, OJO_R, BOCA = centro("helper-l-eye"), centro("helper-r-eye"), centro("joint-mouth")
CUERPO_IDX = sorted({i for c, _ in caras["body"] for i in c})
TOPE = max(V[i][1] for i in CUERPO_IDX)
OJO_Y = (OJO_L[1] + OJO_R[1]) / 2
OJO_X = abs(OJO_L[0] - OJO_R[0]) / 2
OJO_Z = (OJO_L[2] + OJO_R[2]) / 2
HH = TOPE - OJO_Y  # de los ojos a la coronilla
Z = receta.get("zonas", {})
BARBILLA = centro("joint-jaw")
CUELLO = centro("joint-neck")
F = OJO_Y - BARBILLA[1]           # de la barbilla a los ojos
BOCA_Y = BARBILLA[1] + Z.get("boca", 0.40) * F
def zona(i):
    """(pelo, camiseta): 1 = pintar"""
    x, y, z = V[i]
    frente = z > OJO_Z - 0.35 * HH
    lado = min(1.0, abs(x) / (OJO_X * 2.2))
    linea = OJO_Y + HH * (Z.get("pelo_frente", 0.55) - Z.get("pelo_baja_lados", 0.42) * lado ** 2)
    if not frente:
        linea = OJO_Y + HH * Z.get("pelo_atras", 0.05)
    if y > linea and y > OJO_Y + 0.05 * HH and abs(x) < OJO_X * 3.2:
        return (1.0, 0.0)
    if frente and OJO_Y + HH * Z.get("ceja_abajo", 0.10) < y < OJO_Y + HH * Z.get("ceja_arriba", 0.20) and 0.25 * OJO_X < abs(x) < 1.75 * OJO_X:
        return (1.0, 0.0)
    if frente and z > BARBILLA[2] - 0.35 and BOCA_Y + F * Z.get("bigote_abajo", 0.07) < y < BOCA_Y + F * Z.get("bigote_arriba", 0.10) and abs(x) < OJO_X * 0.9:
        return (0.85, 0.0)
    if frente and z > BARBILLA[2] - 0.45 and BARBILLA[1] + F * 0.0 < y < BOCA_Y - F * Z.get("perilla_arriba", 0.12) and abs(x) < OJO_X * Z.get("perilla_ancho", 0.32):
        return (0.8, 0.0)
    # camiseta de tirantes: torso debajo del escote en U, sin brazos
    ancho = Z.get("camiseta_ancho", 1.0)
    escote = CUELLO[1] - Z.get("escote", 0.35) - Z.get("escote_u", 0.55) * max(0.0, 1 - (x / 0.5) ** 2) * (1 if z > CUELLO[2] else 0.3)
    if y < escote and abs(x) < ancho and y > CUELLO[1] - 4.0:
        return (0.0, 1.0)
    return (0.0, 0.0)
ZONA = {i: zona(i) for i in CUERPO_IDX}

# ── 3) materiales toon: difuso → Shader a RGB → rampa constante → emisión ──
def mat_toon(nombre, tonos, mascara=None, color_mascara=None, umbrales=None):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    dif = nt.nodes.new("ShaderNodeBsdfDiffuse")
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    us = umbrales or [i / len(tonos) for i in range(len(tonos))]
    while len(els) < len(tonos):
        els.new(0.5)
    for e, u, c in zip(els, us, tonos):
        e.position = u
        e.color = hexrgb(c)
    emi = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(dif.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs[0], bw.inputs[0])
    nt.links.new(bw.outputs[0], ramp.inputs[0])
    color = ramp.outputs[0]
    if mascara:
        img = nt.nodes.new("ShaderNodeTexImage")
        img.image = bpy.data.images.load(os.path.join(MPFB, "textures", mascara))
        img.image.colorspace_settings.name = "Non-Color"
        mix = nt.nodes.new("ShaderNodeMixRGB")
        mix.inputs[2].default_value = hexrgb(color_mascara)
        nt.links.new(img.outputs[0], mix.inputs[0])
        nt.links.new(ramp.outputs[0], mix.inputs[1])
        # el labio también recibe sombra: lo multiplicamos por la claridad
        mul = nt.nodes.new("ShaderNodeMixRGB")
        mul.blend_type = "MULTIPLY"
        mul.inputs[0].default_value = 1.0
        mul2 = nt.nodes.new("ShaderNodeMapRange")
        mul2.inputs[3].default_value = 0.55
        mul2.inputs[4].default_value = 1.15
        nt.links.new(bw.outputs[0], mul2.inputs[0])
        nt.links.new(mix.outputs[0], mul.inputs[1])
        nt.links.new(mul2.outputs[0], mul.inputs[2])
        color = mul.outputs[0]
    if nombre == "piel":
        geo = nt.nodes.new("ShaderNodeTexCoord")
        xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(geo.outputs["Object"], xyz.inputs[0])
        X, Y, Zc = xyz.outputs[0], xyz.outputs[1], xyz.outputs[2]   # Blender: Z arriba, -Y al frente
        def op(o, a, b=None):
            n = nt.nodes.new("ShaderNodeMath"); n.operation = o
            for k, v in enumerate((a, b)):
                if v is None: continue
                if isinstance(v, (int, float)): n.inputs[k].default_value = v
                else: nt.links.new(v, n.inputs[k])
            return n.outputs[0]
        def mayor(a, b): return op("GREATER_THAN", a, b)
        def menor(a, b): return op("LESS_THAN", a, b)
        def y_(a, b): return op("MULTIPLY", a, b)
        def o_(a, b): return op("MAXIMUM", a, b)
        def parab(x, w):  # max(0, 1-(x/w)^2)
            return op("MAXIMUM", op("SUBTRACT", 1.0, op("POWER", op("DIVIDE", x, w), 2.0)), 0.0)
        ax = op("ABSOLUTE", X)
        frente = menor(Y, -(OJO_Z - 0.35 * HH))
        # pelo: arriba de una línea curva (alta al frente, baja a los lados), o atrás arriba de la nuca
        linea = op("ADD", OJO_Y + HH * (Z.get("pelo_frente", 0.55) - Z.get("pelo_baja_lados", 0.42)), op("MULTIPLY", parab(X, OJO_X * 2.2), HH * Z.get("pelo_baja_lados", 0.42)))
        pelo_f = y_(frente, mayor(Zc, linea))
        pelo_a = y_(op("SUBTRACT", 1.0, frente), mayor(Zc, OJO_Y + HH * Z.get("pelo_atras", 0.05)))
        pelo = o_(pelo_f, pelo_a)
        # cejas: banda curva arriba de cada ojo, más gruesa hacia adentro
        cx = op("SUBTRACT", ax, OJO_X)
        cb = op("ADD", OJO_Y + HH * Z.get("ceja_abajo", 0.11), op("MULTIPLY", parab(cx, OJO_X * 0.8), HH * 0.03))
        ct = op("ADD", cb, op("ADD", HH * Z.get("ceja_grosor", 0.06), op("MULTIPLY", parab(op("SUBTRACT", ax, OJO_X * 0.45), OJO_X * 0.5), HH * 0.02)))
        ceja = y_(y_(frente, y_(mayor(Zc, cb), menor(Zc, ct))), y_(mayor(ax, OJO_X * 0.22), menor(ax, OJO_X * 1.75)))
        # bigote fino arriba del labio
        bb = BOCA_Y + F * Z.get("bigote_abajo", 0.07)
        big = y_(y_(frente, y_(mayor(Zc, op("SUBTRACT", bb, op("MULTIPLY", op("POWER", op("DIVIDE", ax, OJO_X), 2.0), F * 0.05))), menor(Zc, op("SUBTRACT", bb + F * Z.get("bigote_grosor", 0.03), op("MULTIPLY", op("POWER", op("DIVIDE", ax, OJO_X), 2.0), F * 0.05))))), menor(ax, OJO_X * 0.85))
        # perilla: gota al centro de la barbilla
        pb = BARBILLA[1] + F * Z.get("perilla_base", 0.02)
        pt = BOCA_Y - F * Z.get("perilla_arriba", 0.13)
        per = y_(y_(frente, y_(mayor(Zc, pb), menor(Zc, pt))), menor(ax, op("MULTIPLY", parab(op("SUBTRACT", Zc, (pb + pt) / 2), (pt - pb) / 1.6), OJO_X * Z.get("perilla_ancho", 0.32))))
        oscuro = o_(o_(pelo, ceja), o_(op("MULTIPLY", big, 0.85), op("MULTIPLY", per, 0.8)))
        # camiseta de tirantes: debajo del escote en U (al frente) y de la espalda
        esc_f = op("SUBTRACT", CUELLO[1] - Z.get("escote", 0.35), op("MULTIPLY", parab(X, 0.5), Z.get("escote_u", 0.55)))
        esc = op("SUBTRACT", esc_f, op("MULTIPLY", op("SUBTRACT", 1.0, frente), -0.3))
        sisa = op("ADD", Z.get("sisa_arriba", 0.55), op("MULTIPLY", op("MINIMUM", op("MAXIMUM", op("DIVIDE", op("SUBTRACT", CUELLO[1] - 0.45, Zc), 1.1), 0.0), 1.0), Z.get("sisa_abre", 0.45)))
        tirante = menor(ax, sisa)
        camis = y_(y_(menor(Zc, esc), tirante), menor(Zc, CUELLO[1] - Z.get("hombro", 0.32)))
        class _S: pass
        sep = _S(); sep.outputs = [oscuro, camis]
        # camiseta blanca con su propia rampa (blanco / gris cálido)
        rc = nt.nodes.new("ShaderNodeValToRGB")
        rc.color_ramp.interpolation = "CONSTANT"
        rc.color_ramp.elements[0].position = 0.0
        rc.color_ramp.elements[0].color = hexrgb(receta.get("camiseta_sombra", "#b9b0a2"))
        rc.color_ramp.elements[1].position = 0.32
        rc.color_ramp.elements[1].color = hexrgb(receta.get("camiseta", "#f2ede2"))
        nt.links.new(bw.outputs[0], rc.inputs[0])
        mc = nt.nodes.new("ShaderNodeMixRGB")
        nt.links.new(sep.outputs[1], mc.inputs[0])
        nt.links.new(color, mc.inputs[1])
        nt.links.new(rc.outputs[0], mc.inputs[2])
        color = mc.outputs[0]
        mp = nt.nodes.new("ShaderNodeMixRGB")
        mp.inputs[2].default_value = hexrgb(receta.get("pelo", "#140b07"))
        nt.links.new(sep.outputs[0], mp.inputs[0])
        nt.links.new(color, mp.inputs[1])
        color = mp.outputs[0]
    nt.links.new(color, emi.inputs[0])
    nt.links.new(emi.outputs[0], out.inputs[0])
    return m


def mat_plano(nombre, color):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emi = nt.nodes.new("ShaderNodeEmission")
    emi.inputs[0].default_value = hexrgb(color)
    nt.links.new(emi.outputs[0], out.inputs[0])
    return m


def contorno(ob, grosor, color="#120b08"):
    m = mat_plano(ob.name + "-tinta", color)
    m.use_backface_culling = True
    ob.data.materials.append(m)
    sol = ob.modifiers.new("contorno", "SOLIDIFY")
    sol.thickness = grosor
    sol.offset = 1.0
    sol.use_flip_normals = True
    sol.use_rim = False
    sol.material_offset = len(ob.data.materials) - 1


# ── 4) armar el personaje ──
bpy.ops.wm.read_factory_settings(use_empty=True)
piel = receta.get("piel", ["#3e1c0b", "#5d2f18", "#7a4426", "#8b502b", "#a86f4c"])
cuerpo, _ = malla("cuerpo", ["body"])
cuerpo.data.materials.append(mat_toon("piel", piel, "mpfb_lips.jpg", receta.get("labio", "#7a3a2a"), receta.get("umbrales")))
sub = cuerpo.modifiers.new("suave", "SUBSURF")
sub.levels = 2
sub.render_levels = 2
contorno(cuerpo, receta.get("contorno", 0.004))

ojos = []
for lado in ("l", "r"):
    ob, idx = malla("ojo-" + lado, ["helper-" + lado + "-eye"])
    ob.data.materials.append(mat_plano("ojo-blanco", "#e8dccb"))
    ojos.append((ob, idx))
    # iris: esfera chica oscura al frente del ojo
    c = Vector([sum(V[i][k] for i in idx) / len(idx) for k in range(3)])
    c = Vector((c[0], -c[2], c[1]))
    r = max((Vector((V[i][0], -V[i][2], V[i][1])) - c).length for i in idx)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r * 0.48, location=(c[0], c[1] - r * 0.93, c[2]), segments=24, ring_count=12)
    iris = bpy.context.active_object
    iris.scale = (1, 0.25, 1)
    iris.data.materials.append(mat_plano("iris", "#2a160c"))

if receta.get("pelo_casco", True):
    pelo, _ = malla("pelo", ["helper-hair"])
    pelo.data.materials.append(mat_toon("pelo", [receta.get("pelo", "#120b08"), receta.get("pelo2", "#24160e")], umbrales=[0, 0.6]))
    disp = pelo.modifiers.new("encoger", "DISPLACE")
    disp.strength = receta.get("pelo_grosor", -0.01)
    contorno(pelo, receta.get("contorno", 0.004))

# ── 5) luz, cámara y render ──
esc = bpy.context.scene
esc.render.engine = "BLENDER_EEVEE"
esc.render.film_transparent = True
esc.render.resolution_x = receta.get("ancho", 900)
esc.render.resolution_y = receta.get("alto", 1100)
esc.view_settings.view_transform = "Standard"
sol = bpy.data.lights.new("sol", "SUN")
sol.energy = 3.0
lsol = bpy.data.objects.new("sol", sol)
bpy.context.collection.objects.link(lsol)
lsol.rotation_euler = [math.radians(a) for a in receta.get("luz", [62, 0, 58])]
cam = bpy.data.cameras.new("cam")
cam.lens = receta.get("camara", {}).get("lente", 85)
ocam = bpy.data.objects.new("cam", cam)
bpy.context.collection.objects.link(ocam)
esc.camera = ocam

# centro de la cabeza (grupo joint-head) para apuntar la cámara
idx = json.load(open(os.path.join(MPFB, "mesh_metadata", "basemesh_vertex_groups.json")))["joint-head"]
idx = [i for a, b in idx for i in range(a, b + 1)] if isinstance(idx[0], list) else idx
cab = Vector([sum(V[i][k] for i in idx) / len(idx) for k in range(3)])
cab = Vector((cab[0], -cab[2], cab[1]))
cc = receta.get("camara", {})
mira = cab + Vector((0, 0, cc.get("dz", -0.25)))
raiz = bpy.data.objects.new("raiz", None)
bpy.context.collection.objects.link(raiz)
for ob in bpy.context.collection.objects:
    if ob.type in ("MESH",):
        ob.parent = raiz
raiz.location = (0, 0, 0)
for a in angulos:
    raiz.rotation_euler = (0, 0, math.radians(a))
    ocam.location = mira + Vector((0, -cc.get("dist", 6.0), cc.get("alto", 0.0)))
    dirc = mira - ocam.location
    ocam.rotation_euler = dirc.to_track_quat("-Z", "Y").to_euler()
    esc.render.filepath = f"{prefijo}_{int(a):+03d}.png"
    bpy.ops.render.render(write_still=True)
    print("render", esc.render.filepath)
