/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
/**
 * loads and decorates the vertical scroll block
 * @param {Element} block The vertical scroll block element
 */

export default function decorate(block) {
  const blockContainer = document.querySelector('.vertical-scroll-container');

  const imageBlockWrapper = block.querySelector('div > picture').closest('div');
  imageBlockWrapper.classList.add('image-block-wrapper');

  // create one wrapper div for text blocks
  const textBlockWrapper = document.createElement('div');
  textBlockWrapper.classList.add('text-block-wrapper');
  const allTextBlocks = [...block.children].splice(0, 4);

  allTextBlocks.forEach((row) => {
    [...row.children].forEach((col) => {
      textBlockWrapper.append(col);
    });
    row.remove();
  });

  imageBlockWrapper.append(textBlockWrapper);

  // update class name for individual text slides
  const textIcons = block.querySelectorAll('p > picture');
  textIcons.forEach((icon, index) => {
    icon.closest('div').classList.add(`text-block-${index + 1}`);
    icon.closest('div').classList.add('text-block');
  });

  // manage image classes
  const pics = block.querySelectorAll('div > picture');
  pics.forEach((pic, index) => {
    pic.classList.add(`image-${index + 1}`);
    pic.classList.add('image-block');
  });

  function getBlockPos(el) {
    const rect = el.getBoundingClientRect();
    return (
      { top: rect.top, bottom: rect.bottom }
    );
  }

  let lastScrollTop = 0;
  function callbackFunc() {
    // removes fixed block position when doc is scrolled above block
    if (getBlockPos(blockContainer).top > 0) {
      blockContainer.classList.remove('fixed');
    }

    // scroll reaches bottom of block
    // unfixes the block position when doc is scrolled below the block
    if (getBlockPos(blockContainer).bottom < 933) {
      blockContainer.classList.remove('fixed');
      blockContainer.classList.add('unfix');
      textBlockWrapper.style.bottom = '153px';
      textBlockWrapper.style.top = 'unset';
    }

    // fixes block and transition time-blockspace
    if (getBlockPos(blockContainer).top <= 0 && getBlockPos(blockContainer).bottom >= 945) {
      blockContainer.classList.add('fixed');
      blockContainer.classList.remove('unfix');

      // calculate change in scroll position
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // change text block position on scroll
      // Define the scroll range
      const minScroll = 4750; // The scroll position where movement starts
      const maxScroll = 8000; // The scroll position where movement ends

      // Calculate the new top position between 200px and 327px
      let textTopPos = 200 + ((scrollTop - minScroll) / (maxScroll - minScroll)) * (327 - 200);

      // Clamp the value between 200px and 327px
      textTopPos = Math.min(Math.max(textTopPos, 200), 327);
      textBlockWrapper.style.top = `${textTopPos}px`;

      const scrollDown = scrollTop > lastScrollTop;

      // opacity adjustment on scroll functions
      const opacityScrollDown = (el, triggerPoint, opacityMax, idx) => {
        let opacity;
        let zIndex;

        // Check if scrolling down and past the down trigger point
        if (textTopPos > triggerPoint) {
          opacity = 1 - ((textTopPos - triggerPoint) / opacityMax);
          zIndex = Math.max(-1, 0 - ((textTopPos - triggerPoint) / opacityMax));
          if (opacity < 0) {
            opacity = 0; // Ensure opacity does not go below 0
          }
          if (zIndex < -1) zIndex = -1; // Clamp zIndex to -1
        } else {
          opacity = 1; // Full opacity if not yet at downTrigger
          zIndex = 6 - idx; // Default zIndex
        }

        el.style.opacity = opacity;
        el.style.zIndex = zIndex;
      };

      const opacityScrollUp = (el, triggerPoint, opacityMax, idx) => {
        let opacity;
        let zIndex;

        // Check if scrolling up and below the up trigger point
        if (textTopPos < triggerPoint) {
          opacity = ((triggerPoint - textTopPos) / opacityMax);
          // Scale zIndex back up
          zIndex = Math.min(6 - idx, -1 + ((triggerPoint - textTopPos) / opacityMax));
          if (opacity > 1) opacity = 1; // Keep opacity within bounds
          if (zIndex > 0) zIndex = 6 - idx; // Clamp zIndex to 0
        }

        el.style.opacity = opacity;
        el.style.zIndex = zIndex;
      };

      const parallaxScroll = (el, triggerPoint) => {
        const maxTranslate = -150; // Maximum translate value in px

        if (textTopPos > triggerPoint) {
          // Calculate translateY based on how far past the trigger point the user has scrolled
          const translateY = ((textTopPos - triggerPoint) / 350) * maxTranslate;

          // Clamp translateY to maxTranslate so it doesn't exceed the max value
          el.style.transform = `translateY(${Math.max(translateY, maxTranslate)}px)`;
        } else {
          // Reset translateY if above the trigger point
          el.style.transform = 'translateY(0px)';
        }
      };

      const loopEls = (parentEl, opacityTriggers, transitionTriggers, opacityMax, isImage) => {
        for (let i = 0; i < 3; i++) {
          const el = parentEl[i];
          const opacityTriggerPoint = opacityTriggers[i];

          if (textTopPos > opacityTriggerPoint && scrollDown) {
            opacityScrollDown(el, opacityTriggerPoint, opacityMax, i);
          } else if (textTopPos < opacityTriggerPoint && !scrollDown) {
            opacityScrollUp(el, opacityTriggerPoint, opacityMax, i);
          }
        }

        if (isImage) {
          for (let i = 0; i < 4; i++) {
            const el = parentEl[i];
            const transitionStart = transitionTriggers[i];
            parallaxScroll(el, transitionStart);
          }
        }
      };

      // text elements
      const allTextBlocks = Array.from(block.querySelectorAll('.text-block'));
      const textTriggers = [240, 300, 322];
      const maxOpacityScrollText = 5;

      // image elements
      const allImgBlocks = Array.from(block.querySelectorAll('.image-block'));
      const imageTransformTriggers = [0, 227, 248, 263];

      // call looping function for text blocks
      loopEls(allTextBlocks, textTriggers, maxOpacityScrollText, false);

      // call looping function for image blocks
      loopEls(allImgBlocks, textTriggers, imageTransformTriggers, maxOpacityScrollText, true);

      lastScrollTop = scrollTop;
    }
  }

  window.addEventListener('load', callbackFunc);
  window.addEventListener('scroll', callbackFunc);
}
