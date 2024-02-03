let parts = [];
let textures;

async function main() {
  const { gl, meshProgramInfo } = initializeWorld();

  const server = 'http://127.0.0.1:8080/';
  const file = 'KayKit_Furniture_Bits_1.0_FREE/Assets/obj/';

  let objHrefs = [
    'armchair_pillows.obj',
    'couch_pillows.obj',
    'table_medium_long.obj',
    'table_small.obj',
    'table_low.obj',
    'chair_B.obj',
    'chair_stool.obj',
    'bed_double_B.obj',
    'bed_single_B.obj',
    'shelf_B_large_decorated.obj',
    'rug_rectangle_A.obj',
    'rug_rectangle_B.obj',
    'rug_oval_A.obj',
    'rug_oval_B.obj',
    'cabinet_small.obj',
    'cabinet_medium_decorated.obj',
    'cactus_small_B.obj',
    'book_single.obj',
    'book_set.obj',
    'lamp_standing.obj',
    'lamp_table.obj',
    'pictureframe_large_A.obj',
    'pictureframe_standing_A.obj',
    'pictureframe_small_A.obj',
    'pillow_B.obj',
    'pillow_A.obj',
  ];
  objHrefs = objHrefs.map(href => server + file + href);

  const objs = [];

  async function addObject(href) {
    const response = await fetch(href);
    const text = await response.text();
    const obj = parseOBJ(text);
    const baseHref = new URL(href, window.location.href);
    const matTexts = await Promise.all(obj.materialLibs.map(async (filename) => {
      const matHref = new URL(filename, baseHref).href;
      const response = await fetch(matHref);
      return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));

    textures = {
      defaultWhite: twgl.createTexture(gl, { src: [255, 255, 255, 255] }),
    };

    for (const material of Object.values(materials)) {
      Object.entries(material)
        .filter(([key]) => key.endsWith('Map'))
        .forEach(([key, filename]) => {
          let texture = textures[filename];
          if (!texture) {
            const textureHref = new URL(filename, baseHref).href;
            texture = twgl.createTexture(gl, { src: textureHref, flipY: true });
            textures[filename] = texture;
          }
          material[key] = texture;
        });
    }

    objs.push(obj);

    const defaultMaterial = {
      diffuse: [1, 1, 1],
      diffuseMap: textures.defaultWhite,
      ambient: [0, 0, 0],
      specular: [1, 1, 1],
      shininess: 400,
      opacity: 1,
    };

    const part = obj.geometries.map(({ material, data }) => {
      if (data.color) {
        if (data.position.length === data.color.length) {
          data.color = { numComponents: 3, data: data.color };
        }
      } else {
        data.color = { value: [1, 1, 1, 1] };
      }

      const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
      const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);

      const contentElem = document.querySelector('#content');
     
      const viewElem = createElem('div', contentElem, 'view');
      const labelElem = createElem('button', viewElem, 'label');
      labelElem.textContent = `Item ${objs.length}`;
      labelElem.id = `Item${objs.length}`;

      return {
        material: {
          ...defaultMaterial,
          ...materials[material],
        },
        bufferInfo,
        vao,
        element: viewElem,
      };
    });

    parts.push(...part);
  }

  for (const href of objHrefs) {
    await addObject(href);
  }

  function drawScene(worldMatrix, bufferInfo, vao, material) {
    gl.bindVertexArray(vao);
    twgl.setUniforms(meshProgramInfo, {
      u_world: worldMatrix,
    }, material);
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  const extentsArray = objs.map(obj => getGeometriesExtents(obj.geometries));

  const allExtents = extentsArray.reduce(({ min, max }, extents) => {
    return {
      min: min.map((min, ndx) => Math.min(extents.min[ndx], min)),
      max: max.map((max, ndx) => Math.max(extents.max[ndx], max)),
    };
  }, {
    min: Array(3).fill(Number.POSITIVE_INFINITY),
    max: Array(3).fill(Number.NEGATIVE_INFINITY),
  });

  const range = m4.subtractVectors(allExtents.max, allExtents.min);

  const objOffset = m4.scaleVector(
    m4.addVectors(
      allExtents.min,
      m4.scaleVector(range, 0.5)),
    -1);

  const cameraTarget = [0, 0, 0];
  const radius = m4.length(range) * 1.2;
  const cameraPosition = m4.addVectors(cameraTarget, [
    0,
    0,
    radius,
  ]);
  const zNear = radius / 100;
  const zFar = radius * 3;

  newGui(objHrefs.length);

  
  function render() {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.SCISSOR_TEST);

    gl.canvas.style.transform = `translateY(${window.scrollY}px)`;
  
    const fieldOfViewRadians = degToRad(60);
    
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
   
    const content2Width = 0.7 * viewportWidth;  
    const content2Height = viewportHeight;   
    const aspect = content2Width / content2Height;
    
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    const up = [0, 1, 0];
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);
    const view = m4.inverse(camera);

    var viewProjectionMatrix = m4.multiply(projection, view);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
    };
  
    gl.useProgram(meshProgramInfo.program);
    twgl.setUniforms(meshProgramInfo, sharedUniforms);

    for (const {bufferInfo, vao, material, element, config} of parts) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top  > gl.canvas.clientHeight ||
          rect.right  < 0 || rect.left > gl.canvas.clientWidth) {
        continue;  
      }

      const width  = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left   = rect.left;
      const bottom = gl.canvas.clientHeight - rect.bottom - 1;

      gl.viewport(left, bottom, width, height);
      gl.scissor(left, bottom, width, height);

      let u_world;
      if (config !== undefined) {
        u_world = computeMatrix(
          m4.identity(),
          config.translationX,
          config.translationY,
          config.translationZ,
          config.rotateX,
          config.rotateY,
          config.rotateZ,
          config.scaleX + config.scaleUni,
          config.scaleY + config.scaleUni,
          config.scaleZ + config.scaleUni,
        );

        let aux = [];
        aux.push(config.diffuse[0]/255);
        aux.push(config.diffuse[1]/255);
        aux.push(config.diffuse[2]/255);
        material.diffuse = aux;

        aux = [];
        aux.push(config.ambient[0]/255);
        aux.push(config.ambient[1]/255);
        aux.push(config.ambient[2]/255);
        material.ambient = aux;

        aux = [];
        aux.push(config.specular[0]/255);
        aux.push(config.specular[1]/255);
        aux.push(config.specular[2]/255);
        material.specular = aux;

        material.shininess = config.shininess;
        material.opacity = config.opacity;


        if (config.diffuseMap == 'defaultWhite'){
          material.diffuseMap = textures['defaultWhite'];
        } else{
          material.diffuseMap = textures['furniturebits_texture.png'];
        }
        
      } else {
        u_world = m4.translate(m4.identity(), 0.0, -1.5, 0.0);
      } 
      drawScene(u_world, bufferInfo, vao, material);
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);


  for (let i = 1; i <= objHrefs.length; i++) {
    document.getElementById(`Item${i}`).addEventListener("click", function(event) {
        handleButtonClick(event, i-1);
    });
  }
  
  function handleButtonClick(event, index) {
    const config = loadGUI(index);
    console.log(textures);
    parts.push({
      material: {
        ...parts[index].material,
      },
      bufferInfo: parts[index].bufferInfo,
      vao: parts[index].vao,
      element: document.querySelector('#content2'),
      config: config,
      index: index,
    });
  }

  document.getElementById('save').addEventListener('click', function() {
    const savedData = [];
    for (let i = objs.length; i < parts.length; i++) {
      savedData.push({
        config: parts[i].config,
        index: parts[i].index,
      });
    }

    const json = JSON.stringify({ parts: savedData });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    link.download = 'cenas/myModel.json';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }); 

  document.getElementById('clear').addEventListener('click', function(){
    const save = [];
  
    for (let i = 0; i < objHrefs.length; i++) {
        save.push(parts[i]);
    }
    parts = save;
    gui.destroy();
    gui = null;
    newGui(objHrefs.length);
  });

}

async function loadJson() {
  const input = document.getElementById('input');
  const file = input.files[0];

  if (!file) {
    return;
  }

  const jsonUrl = URL.createObjectURL(file);
  const response = await fetch(jsonUrl);
  const jsonData = await response.json();

  const loadedParts = jsonData.parts;

  for (const loadedPart of loadedParts) {
    const { config, index } = loadedPart;

    let configNew = loadGUI(index);
    configNew.translationX = config.translationX;
    configNew.translationY = config.translationY;
    configNew.translationZ = config.translationZ;
    configNew.rotateX = config.rotateX;
    configNew.rotateY = config.rotateY;
    configNew.rotateZ = config.rotateZ;
    configNew.scaleX = config.scaleX + config.scaleUni;
    configNew.scaleY = config.scaleY + config.scaleUni;
    configNew.scaleZ = config.scaleZ + config.scaleUni;
    configNew.diffuse[0] = config.diffuse[0];
    configNew.diffuse[1] = config.diffuse[1];
    configNew.diffuse[2] = config.diffuse[2];
    configNew.ambient[0] = config.ambient[0];
    configNew.ambient[1] = config.ambient[1];
    configNew.ambient[2] = config.ambient[2];
    configNew.specular[0] = config.specular[0];
    configNew.specular[1] = config.specular[1];
    configNew.specular[2] = config.specular[2];
    configNew.shininess = config.shininess;
    configNew.opacity = config.opacity;
    configNew.diffuseMap = config.diffuseMap;

    parts.push({
      bufferInfo: parts[index].bufferInfo,
      element: document.querySelector('#content2'),
      material: {
        ...parts[index].material,
      },
      vao: parts[index].vao,
      config: configNew,
      index: index,
    });
  }
}



main();