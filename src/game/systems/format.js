export function fmt(n) {
  if (n < 1000) return Math.floor(n).toString();
  const units = ["k", "M", "B", "T", "Qa", "Qi"];
  let u = -1;
  let x = n;
  while (x >= 1000 && u < units.length - 1) {
    x /= 1000;
    u++;
  }
  return x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0) + units[u];
}
