import { createOptimizedPicture } from '../../scripts/aem.js';

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

	// code for fetching html from story pages
	async function fetchHtml(url){
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
	const parsedStory = parser.parseFromString(story, "text/html");

	// Select specific elements from the parsed HTML
	const heroPicture = parsedStory.querySelector(".hero.story picture");
	const storyTitle = parsedStory.querySelector("h1");

	// video link
	const heroLinks = parsedStory.querySelectorAll(".hero.story a");
	const videoLink = Array.from(heroLinks).filter(link => link.href.endsWith(".mp4"))[0];

	// industry tag(s)
	const strongEls = parsedStory.querySelectorAll(".columns.quote p strong")
	const industryMatch = Array.from(strongEls).find(el => 
		el.textContent.includes("Industry")
	);

	const industryTags = []
	if(industryMatch && industryMatch != undefined) {
		const paraEl = industryMatch.closest("p")
		const nestedLinks = paraEl.querySelectorAll("a");
		nestedLinks.forEach(el => {
			industryTags.push(el.innerText)
		})
	}

	const tagWrapper = document.createElement('div')
	tagWrapper.classList.add('tag-wrapper')
	industryTags.forEach(tag => {
		let span = document.createElement("span") 
		span.textContent = tag
		tagWrapper.append(span)
	})
	
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
	`
	ul.append(storyLi);
  }


	if(isStoryLinks){
		const blockLinks = block.querySelectorAll("a")
		blockLinks.forEach(link => {
			fetchHtml(link)
		})
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
	  } else if (!isStoryLinks){
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