export const animationState = {
  hue: 0,
  lightness: 50,
};

export function setAnimation(h: number, l: number) {
  animationState.hue = h;
  animationState.lightness = l;
}

export default animationState;
