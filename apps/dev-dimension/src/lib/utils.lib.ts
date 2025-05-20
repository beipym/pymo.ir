/**
 * 
 * @returns a random color
 */
export const getRandomColor = ()=>{
  const color = Math.floor(Math.random() * 16777216).toString(16);
  return `#${color}`;
}