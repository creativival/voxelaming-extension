function getRotationMatrix(pitch, yaw, roll) {
  pitch = degreesToRadians(pitch);
  yaw = degreesToRadians(yaw);
  roll = degreesToRadians(roll);

  // Pitch (Rotation around X-axis)
  let Rx = [
    [1, 0, 0],
    [0, Math.cos(pitch), -Math.sin(pitch)],
    [0, Math.sin(pitch), Math.cos(pitch)]
  ];

  // Yaw (Rotation around Y-axis)
  let Ry = [
    [Math.cos(yaw), 0, Math.sin(yaw)],
    [0, 1, 0],
    [-Math.sin(yaw), 0, Math.cos(yaw)]
  ];

  // Roll (Rotation around Z-axis)
  let Rz = [
    [Math.cos(roll), -Math.sin(roll), 0],
    [Math.sin(roll), Math.cos(roll), 0],
    [0, 0, 1]
  ];

  // Multiply matrices in the order Rx, Rz, Ry
  let R = matrixMultiply(Rx, matrixMultiply(Rz, Ry));
  return R;
}

function matrixMultiply(A, B) {
  let result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function transformPointByRotationMatrix(point, R) {
  let [x, y, z] = point;
  let xNew = R[0][0] * x + R[0][1] * y + R[0][2] * z;
  let yNew = R[1][0] * x + R[1][1] * y + R[1][2] * z;
  let zNew = R[2][0] * x + R[2][1] * y + R[2][2] * z;
  return [xNew, yNew, zNew];
}

function addVectors(vector1, vector2) {
  return vector1.map((val, index) => val + vector2[index]);
}

function transpose3x3(matrix) {
  return [
    [matrix[0][0], matrix[1][0], matrix[2][0]],
    [matrix[0][1], matrix[1][1], matrix[2][1]],
    [matrix[0][2], matrix[1][2], matrix[2][2]]
  ];
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export {
  getRotationMatrix,
  matrixMultiply,
  transformPointByRotationMatrix,
  addVectors,
  transpose3x3,
  degreesToRadians
};