export function log (...arg: any[]) {
  console.log(...arg);
}

export function flag () {
  return new Date().getTime();
}

export function cast_time (flag: number) {
  return (new Date().getTime() - flag) + 'ms;'
}