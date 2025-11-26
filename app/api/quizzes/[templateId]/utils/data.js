// app/api/utils/data.js (Bạn nên tạo file này)

import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

export function loadData(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}