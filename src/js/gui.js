let numObjGui = []

const newGui = (objHrefsLength) => {
  gui = new dat.GUI();
  numObjGui = new Array(objHrefsLength).fill(0);
}

const loadGUI = (index) => {
  const configGen = {
    rotateX: degToRad(5),
    rotateY: degToRad(0),
    rotateZ: degToRad(0),
    translationX: 0.0,
    translationY: -1,
    translationZ: 0.0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleZ: 1.0,
    scaleUni: 0.0,
    diffuse: [255, 255, 255],
    diffuseMap: textures['furniturebits_texture.png'],
    ambient: [0, 0, 0],
    specular: [255, 255, 255],
    shininess: 400,
    opacity: 1, 
  };

  numObjGui[index] += 1;
  const element = gui.addFolder(`Item ${index + 1}.${numObjGui[index]}`);
  const rotate = element.addFolder('Rotate');
  const translate = element.addFolder('Translate');
  const scale = element.addFolder('Scale');
  const texture = element.addFolder('Texture');

  rotate.add(configGen, "rotateX", 0, 20, 0.1).name("Rotate X");
  rotate.add(configGen, "rotateY", 0, 20, 0.1).name("Rotate Y");
  rotate.add(configGen, "rotateZ", 0, 20, 0.1).name("Rotate Z");
  translate.add(configGen, "translationX", -8, 8, 0.1).name("Translation X");
  translate.add(configGen, "translationY", -8, 8, 0.1).name("Translation Y");
  translate.add(configGen, "translationZ", -8, 8, 0.1).name("Translation Z");
  scale.add(configGen, "scaleX", -1, 5, 0.1).name("Scale X");
  scale.add(configGen, "scaleY", -1, 5, 0.1).name("Scale Y");
  scale.add(configGen, "scaleZ", -1, 5, 0.1).name("Scale Z");
  scale.add(configGen, "scaleUni", -1, 5, 0.1).name("Uniform Scale");
  texture.addColor(configGen, "diffuse").name("Diffuse Color");
  texture.addColor(configGen, "ambient").name("Ambient Color");
  texture.addColor(configGen, "specular").name("Specular Color");
  texture.add(configGen, "shininess", 0, 1000).name("Shininess");
  texture.add(configGen, "opacity", 0, 1).name("Opacity");
  texture.add(configGen, "diffuseMap", Object.keys(textures)).name("Diffuse Map");

  return configGen;
};
