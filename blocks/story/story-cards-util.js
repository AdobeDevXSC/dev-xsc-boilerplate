// code for fetching html from story pages
export default async function fetchHtml(url, ul) {
  const obj = {
    method: 'get',
    headers: new Headers({
      'Content-Type': 'text/html',
    }),
    credentials: 'include',
  };

  let story = await fetch(url, obj);
  story = await story.text();

  const parser = new DOMParser();
  const parsedStory = parser.parseFromString(story, 'text/html');

  // Select specific elements from the parsed HTML
  const heroPicture = parsedStory.querySelector('.hero.story picture');
  const storyTitle = parsedStory.querySelector('h1');

  // video link
  const heroLinks = parsedStory.querySelectorAll('.hero.story a');
  const videoLink = Array.from(heroLinks).filter((link) => link.href.endsWith('.mp4'))[0];

  // industry tag(s)
  const strongEls = parsedStory.querySelectorAll('.columns.quote p strong');
  const industryMatch = Array.from(strongEls).find((el) => el.textContent.includes('Industry'));

  const industryTags = [];
  if (industryMatch && industryMatch !== undefined) {
    const paraEl = industryMatch.closest('p');
    const nestedLinks = paraEl.querySelectorAll('a');
    nestedLinks.forEach((el) => {
      industryTags.push(el.innerText);
    });
  }

  const tagWrapper = document.createElement('div');
  tagWrapper.classList.add('tag-wrapper');
  industryTags.forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    tagWrapper.append(span);
  });

  const storyLi = document.createElement('li');
  storyLi.innerHTML = `
      ${heroPicture.outerHTML}
      <div class="story-card content-wrapper">
        ${tagWrapper.outerHTML}
        <h4>${storyTitle.innerHTML}</h4>
        <div class="buttons-container">
          <a class="video-btn button" href=${videoLink.href} target="_blank">Watch Video</a>
          <a class="read-story button" href=${url}>Read Story</a>
        </div>
      </div>
    `;
  ul.append(storyLi);
}
