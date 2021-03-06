import cssUtils from './css';

/**
 * Resolves and returns the transform and perspective properties for a given
 * element. 
 */

const getTransformForElement = elem => {
  let m1 = new THREE.Matrix4();
  let transformMatrix = new THREE.Matrix4();
  let transformOrigin = new THREE.Vector3();
  let transformOriginMatrix = new THREE.Matrix4();
  let perspectiveOrigin = new THREE.Vector3();
  let osParent = elem;
  let stack = [];
  let posX = 0;
  let posY = 0;
  let perspective = 0;

  // if this element doesn't have a width or height bail out now.
  if (elem.offsetWidth === 0 || elem.offsetHeight === 0) {
    return {
      matrix: m1
    };
  }

  posX -= elem.offsetWidth / 2;
  posY += elem.offsetHeight / 2;

  // We need to apply transforms from the root so we walk up the DOM tree,
  // pushing each node onto a stack. While we're walking to the DOM we also
  // resolve the elements X/Y position.
  while (elem) {
    if (elem === osParent) {
      posX += elem.offsetLeft;
      posY += elem.offsetTop;
      osParent = elem.offsetParent;
    }
    stack.push(elem);
    posX -= elem.scrollLeft;
    posY -= elem.scrollTop;
    elem = elem.parentElement;
  }


  m1.makeTranslation(posX, -posY, 0);

  // Now we can resolve transforms.
  while (elem = stack.pop()) {

    let style = getComputedStyle(elem);

    // TODO: It's possible to nest perspectives. Need to research the impact
    // of this and, if possible, how to emulate it. For now, we'll just use
    // the last value found.
    let perspectiveValue = style.perspective;
    if (perspectiveValue !== 'none') {
      perspective = cssUtils.parseUnitValue(perspectiveValue);

      // TODO: strictly speaking, `perspective-origin` can be set on any
      // element, not just the one that has `perspective`. Research the impact
      // of setting perspective-origin on different elements in the DOM tree.
      let perspectiveOriginValue = style.perspectiveOrigin;
      if (perspectiveOriginValue) {
        cssUtils.parseOriginValue(perspectiveOriginValue, perspectiveOrigin);
      }
    }

    cssUtils.parseOriginValue(style.transformOrigin, transformOrigin);
    cssUtils.parseTransformValue(style.transform, transformMatrix);

    let ox = transformOrigin.x - elem.offsetWidth / 2;
    let oy = transformOrigin.y - elem.offsetHeight / 2;
    let oz = transformOrigin.z;

    // If the computed `transform-origin` is a value other than `50% 50% 0`
    // (`0,0,0` in THREE coordinate space) then we need to translate by the
    // origin before multiplying the element's transform matrix. Finally, we
    // need undo the translation.
    if (ox !==0 || oy !==0 || oz !== 0) {
      m1.multiply(transformOriginMatrix.makeTranslation(ox, -oy, oz));
      m1.multiply(transformMatrix);
      m1.multiply(transformOriginMatrix.makeTranslation(-ox, oy, -oz));
    } else {
      m1.multiply(transformMatrix);
    }
  }

  return {
    matrix: m1,
    perspective: perspective,
    perspectiveOrigin: perspectiveOrigin
  };
}


const createStylesheet = cssText => {
  let styleElem = document.createElement('style');
  styleElem.textContent = cssText;
  return styleElem;
}


export default {
  getTransformForElement,
  createStylesheet
}
