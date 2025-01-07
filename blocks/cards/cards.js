import { createOptimizedPicture } from '../../scripts/aem.js';
import fetchHtml from '../story/story-cards-util.js';

export default async function decorate(block) {
  const isJSON = block.classList.contains('is-json');
  const isStoryLinks = block.classList.contains('story-links');

  async function fetchJson(link) {
    const response = await fetch(link?.href);

    if (response.ok) {
      const jsonData = await response.json();
      const data = jsonData?.data;
      return data;
    }
    return 'an error occurred';
  }

  const ul = document.createElement('ul');

  if (isStoryLinks) {
    const blockLinks = block.querySelectorAll('a');
    blockLinks.forEach((link) => {
      fetchHtml(link, ul);
    });
  }

  if (isJSON) {
    const link = block.querySelector('a');
    const cardData = await fetchJson(link);
    cardData.forEach((item) => {
      const picture = createOptimizedPicture(item.image, item.title, false, [{ width: 320 }]);
      picture.lastElementChild.width = '320';
      picture.lastElementChild.height = '180';

      const createdCard = document.createElement('li');

      createdCard.innerHTML = `
        <div class="cards-card-body">
          // place inner HTML structure based on JSON response as needed
        </div>
      `;
      ul.append(createdCard);
    });
  } else if (!isStoryLinks) {
    [...block.children].forEach((row) => {
      const li = document.createElement('li');
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-card-image';
        } else if (div.children.length === 1 && div.querySelector('span')) {
          div.className = 'cards-card-icon';
        } else {
          div.className = 'cards-card-body';
        }
      });
      ul.append(li);
    });
  }

  block.textContent = '';
  block.append(ul);
}
