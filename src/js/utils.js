const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
      for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }
    return { min, max };
  }

function getGeometriesExtents(geometries) {
return geometries.reduce(({ min, max }, { data }) => {
    const minMax = getExtents(data.position);
    return {
    min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
    max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
    };
}, {
    min: Array(3).fill(Number.POSITIVE_INFINITY),
    max: Array(3).fill(Number.NEGATIVE_INFINITY),
});
}

function createElem(type, parent, className) {
  const elem = document.createElement(type);
  parent.appendChild(elem);
  if (className) {
      elem.className = className;
  }
  return elem;
}
  
function computeMatrix(viewProjectionMatrix, xTranslation, yTranslation, zTranslation, xRotation, yRotation, zRotation, xScale, yScale, zScale) {
  var matrix = m4.translate(viewProjectionMatrix, xTranslation, yTranslation, zTranslation);
  matrix = m4.xRotate(matrix,xRotation);
  matrix = m4.yRotate(matrix,yRotation);
  matrix = m4.zRotate(matrix,zRotation);
  matrix = m4.scale(matrix, xScale, yScale, zScale);
  return matrix;
}
