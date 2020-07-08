window.NativeNotification = Notification;
class Notification {
    constructor(input) {
        this.delete = () => { console.error('Not deployed yet!'); };
        this.config = Object.assign({
            type: 'info',
            content: null,
            consistent: false
        }, input);
    }

    deploy() {
        if (this.config.content === null || this.config.content === false || this.config.content === '' || this.config.content === undefined) {
            alert('Error deploying notification: content cannot be empty!');
        } else {
            var validNotificationTypes = ['error', 'info', 'success', 'warning'];
            if (!validNotificationTypes.includes(this.config.type)) {
                alert('Invalid notification type: ' + this.config.type);
            } else {
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });

                this.delete = () => document.querySelectorAll('div.notifications div[uuid="' + uuid + '"]').forEach(el => {
                    el.style.maxHeight = '0px';
                    setTimeout(() => el.parentNode.removeChild(el), 1000);
                });

                var container = document.createElement('div');
                container.setAttribute('uuid', uuid);

                var block = document.createElement('div');
                block.classList.add(this.config.type);

                var content = document.createElement('p');
                content.innerHTML = this.config.content;
                block.appendChild(content);

                var close = document.createElement('span');
                close.innerHTML = '&times;';
                close.addEventListener('click', this.delete);
                block.appendChild(close);

                container.appendChild(block);
                container = document.querySelector('div.notifications').appendChild(container);
                container.style.maxHeight = (container.querySelector('div').offsetHeight + 25) + 'px';

                if (this.config.consistent !== true) {
                    const timeout = setTimeout(this.delete, 5500);
                    const fadeTimeout = setTimeout(() => document.querySelectorAll('div.notifications div[uuid="' + uuid + '"] > div').forEach(el => el.style.opacity = 0), 4000);
                    container.addEventListener('mouseover', e => {
                        clearTimeout(timeout);
                        clearTimeout(fadeTimeout);
                        e.target.style.transition = 'none';
                        e.target.style.opacity = 1;
                    });
                }
            }
        }
    }
}
