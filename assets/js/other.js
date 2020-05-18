document.querySelectorAll('.current-year').forEach(el => el.innerText = new Date().getFullYear());

(async function() {
    await fetch('https://strapi.michadevries.nl/Rable-Posts').then(res => res.json()).then(res => res.forEach(post => {
        var card = document.createElement('div');

        if (post.Banner !== null) {
            var banner = document.createElement('img');
            let linebreak = document.createElement('br');
            banner.url = post.Banner.url;
            banner.alt = 'unable to load banner';

            card.appendChild(banner);
            card.appendChild(linebreak);
        }

        if (post.Title !== null && post.Title !== '') {
            var title = document.createElement('h2');
            let linebreak = document.createElement('br');
            title.innerHTML = post.Title;

            card.appendChild(title);
            card.appendChild(linebreak);
        }

        if (post.Content !== null && post.Content !== '') {
            var content = document.createElement('p');
            content.innerHTML = post.Content;

            card.appendChild(content);
        }

        document.querySelector('.posts').appendChild(card);
    })).catch(e => {
        console.error(e);
        alert('Failed to fetch the posts from michadevries.nl!');
    });

    ClientRouter.initializeLinks();
})();

if (location.host =='rable.app.michadevries.nl') document.querySelector('.public-docs').style.display = 'none';
