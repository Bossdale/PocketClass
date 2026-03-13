export function randNumber(range: number){
    const rand = Math.floor(Math.random() * range) + 1;
    return rand;
}