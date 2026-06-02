# Pokaya Agent 3D Asset Drop Folder

Put the production character model here:

- `pokaya-agent.glb`

The frontend already tries to load `/models/agent/pokaya-agent.glb` with Three.js `GLTFLoader`.
If the file is present and valid, the production model replaces the temporary prototype scene automatically.

Required animation clip names:

- `idle_stand`
- `idle_sleep`
- `idle_run`
- `walk`
- `work_typing`
- `work_image`
- `work_video`
- `thinking`
- `success`

Recommended source delivery:

- `source.blend`
- `textures/`
- exported `pokaya-agent.glb`
- viewport renders for desktop and mobile QA

Model budget:

- Character: 5k-15k triangles
- Full visible scene/stations: 20k-40k triangles
- Primary GLB: 3MB-8MB
- Texture size: 1024 or 2048
