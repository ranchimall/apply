const uiGlobals = {}
const { html, svg, render: renderElem } = uhtml;
const { signal, computed, effect } = preactSignalsCore;

uiGlobals.connectionErrorNotification = []
//Checks for internet connection status
if (!navigator.onLine)
    uiGlobals.connectionErrorNotification.push(notify('There seems to be a problem connecting to the internet, Please check you internet connection.', 'error'))
window.addEventListener('offline', () => {
    uiGlobals.connectionErrorNotification.push(notify('There seems to be a problem connecting to the internet, Please check you internet connection.', 'error'))
})
window.addEventListener('online', () => {
    uiGlobals.connectionErrorNotification.forEach(notification => {
        getRef('notification_drawer').remove(notification)
    })
    notify('We are back online.', 'success')
})

// Use instead of document.getElementById
function getRef(elementId) {
    return document.getElementById(elementId);
}
// displays a popup for asking permission. Use this instead of JS confirm
/**
@param {string} title - Title of the popup
@param {object} options - Options for the popup 
@param {string} options.message - Message to be displayed in the popup
@param {string} options.cancelText - Text for the cancel button
@param {string} options.confirmText - Text for the confirm button
@param {boolean} options.danger - If true, confirm button will be red
*/
const getConfirmation = (title, options = {}) => {
    return new Promise(resolve => {
        const { message = '', cancelText = 'Cancel', confirmText = 'OK', danger = false } = options
        getRef('confirm_title').innerText = title;
        getRef('confirm_message').innerText = message;
        const cancelButton = getRef('confirmation_popup').querySelector('.cancel-button');
        const confirmButton = getRef('confirmation_popup').querySelector('.confirm-button')
        confirmButton.textContent = confirmText
        cancelButton.textContent = cancelText
        if (danger)
            confirmButton.classList.add('button--danger')
        else
            confirmButton.classList.remove('button--danger')
        const { opened, closed } = openPopup('confirmation_popup')
        confirmButton.onclick = () => {
            closePopup({ payload: true })
        }
        cancelButton.onclick = () => {
            closePopup()
        }
        closed.then((payload) => {
            confirmButton.onclick = null
            cancelButton.onclick = null
            if (payload)
                resolve(true)
            else
                resolve(false)
        })
    })
}
// Use when a function needs to be executed after user finishes changes
const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}
// adds a class to all elements in an array
function addClass(elements, className) {
    elements.forEach((element) => {
        document.querySelector(element).classList.add(className);
    });
}
// removes a class from all elements in an array
function removeClass(elements, className) {
    elements.forEach((element) => {
        document.querySelector(element).classList.remove(className);
    });
}
// return querySelectorAll elements as an array
function getAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
}

let zIndex = 50
// function required for popups or modals to appear
function openPopup(popupId, pinned) {
    if (popupStack.peek() === undefined) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePopup()
            }
        })
    }
    zIndex++
    getRef(popupId).setAttribute('style', `z-index: ${zIndex}`)
    return getRef(popupId).show({ pinned })
}


// hides the popup or modal
function closePopup(options = {}) {
    if (popupStack.peek() === undefined)
        return;
    popupStack.peek().popup.hide(options)
}

document.addEventListener('popupopened', async e => {
    //pushes popup as septate entry in history
    history.pushState({ type: 'popup' }, null, null)
    switch (e.target.id) {
        case 'profile_popup':
            renderElem(getRef('profile_popup__content'), html`
                <div class="grid gap-1-5">
                    <div class="grid gap-0-5">
                        <h4>
                            BTC integrated with FLO
                        </h4>
                        <p>
                            You can use your FLO private key to perform transactions on the BTC network within our
                            app
                            ecosystem. The private key is the same for both.
                        </p>
                    </div>
                    <div class="grid gap-0-5">
                        <b>My FLO address</b>
                        <sm-copy class="user-flo-id" clip-text value=${floGlobals.myFloID}></sm-copy>
                    </div>
                    <div class="grid gap-0-5">
                        <b>My Bitcoin address</b>
                        <sm-copy class="user-btc-id" clip-text value=${floGlobals.myBtcID}></sm-copy>
                    </div>
                    <button class="button button--danger justify-self-start" onclick="signOut()">Sign out</button>
                </div>
            `)
            break;
    }
})

document.addEventListener('popupclosed', e => {
    zIndex--;
    switch (e.target.id) {
        case 'task_popup':
            delete getRef('task_popup').dataset.taskId;
            break;
        case 'send_update_popup':
            renderElem(getRef('send_update_popup__content'), html``)
            break;
    }

    if (popupStack.peek() === undefined) {
        // if there are no more popups, do something
        document.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePopup()
            }
        })
    }
})
window.addEventListener('popstate', e => {
    if (!e.state) return
    switch (e.state.type) {
        case 'popup':
            closePopup()
            break;
    }
})
//Function for displaying toast notifications. pass in error for mode param if you want to show an error.
/**
 * @param {string} message - Message to be displayed in the notification
 * @param {string} mode - Mode of the notification. Can be 'success' or 'error' or ''
 * @param {object} options - Options for the notification
 * @param {boolean} options.pinned - If true, notification will not be dismissed automatically
 */
function notify(message, mode, options = {}) {
    let icon
    switch (mode) {
        case 'success':
            icon = `<svg class="icon icon--success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"/></svg>`
            break;
        case 'error':
            icon = `<svg class="icon icon--error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/></svg>`
            if (!options.hasOwnProperty('timeout'))
                options.pinned = true
            break;
    }
    if (mode === 'error') {
        console.error(message)
    }
    return getRef("notification_drawer").push(message, { icon, ...options });
}

function getFormattedTime(timestamp, format) {
    try {
        if (String(timestamp).length < 13)
            timestamp *= 1000
        let [day, month, date, year] = new Date(timestamp).toString().split(' '),
            minutes = new Date(timestamp).getMinutes(),
            hours = new Date(timestamp).getHours(),
            currentTime = new Date().toString().split(' ')

        minutes = minutes < 10 ? `0${minutes}` : minutes
        let finalHours = ``;
        if (hours > 12)
            finalHours = `${hours - 12}:${minutes}`
        else if (hours === 0)
            finalHours = `12:${minutes}`
        else
            finalHours = `${hours}:${minutes}`

        finalHours = hours >= 12 ? `${finalHours} PM` : `${finalHours} AM`
        switch (format) {
            case 'date-only':
                return `${month} ${date}, ${year}`;
                break;
            case 'time-only':
                return finalHours;
            default:
                return `${month} ${date} ${year}, ${finalHours}`;
        }
    } catch (e) {
        console.error(e);
        return timestamp;
    }
}
// detect browser version
function detectBrowser() {
    let ua = navigator.userAgent,
        tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join(' ');
}
function createRipple(event, target) {
    const circle = document.createElement("span");
    const diameter = Math.max(target.clientWidth, target.clientHeight);
    const radius = diameter / 2;
    const targetDimensions = target.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (targetDimensions.left + radius)}px`;
    circle.style.top = `${event.clientY - (targetDimensions.top + radius)}px`;
    circle.classList.add("ripple");
    const rippleAnimation = circle.animate(
        [
            {
                opacity: 1,
                transform: `scale(0)`
            },
            {
                transform: "scale(4)",
                opacity: 0,
            },
        ],
        {
            duration: 600,
            fill: "forwards",
            easing: "ease-out",
        }
    );
    target.append(circle);
    rippleAnimation.onfinish = () => {
        circle.remove();
    };
}

class Router {
    /**
     * @constructor {object} options - options for the router
     * @param {object} options.routes - routes for the router
     * @param {object} options.state - initial state for the router
     * @param {function} options.routingStart - function to be called before routing
     * @param {function} options.routingEnd - function to be called after routing
     */
    constructor(options = {}) {
        const { routes = {}, state = {}, routingStart, routingEnd } = options
        this.routes = routes
        this.state = state
        this.routingStart = routingStart
        this.routingEnd = routingEnd
        this.lastPage = null
        window.addEventListener('hashchange', e => this.routeTo(window.location.hash))
    }
    /**
     * @param {string} route - route to be added
     * @param {function} callback - function to be called when route is matched
     */
    addRoute(route, callback) {
        this.routes[route] = callback
    }
    /**
     * @param {string} route
     */
    handleRouting = async (page) => {
        if (this.routingStart) {
            this.routingStart(this.state)
        }
        if (this.routes[page]) {
            await this.routes[page](this.state)
            this.lastPage = page
        } else {
            if (this.routes['404']) {
                this.routes['404'](this.state);
            } else {
                console.error(`No route found for '${page}' and no '404' route is defined.`);
            }
        }
        if (this.routingEnd) {
            this.routingEnd(this.state)
        }
    }
    async routeTo(destination) {
        try {
            let page
            let wildcards = []
            let params = {}
            let [path, queryString] = destination.split('?');
            if (path.includes('#'))
                path = path.split('#')[1];
            if (path.includes('/'))
                [, page, ...wildcards] = path.split('/')
            else
                page = path
            this.state = { page, wildcards, lastPage: this.lastPage, params }
            if (queryString) {
                params = new URLSearchParams(queryString)
                this.state.params = Object.fromEntries(params)
            }
            if (document.startViewTransition) {
                document.startViewTransition(async () => {
                    await this.handleRouting(page)
                })
            } else {
                // Fallback for browsers that don't support View transition API:
                await this.handleRouting(page)
            }
        } catch (e) {
            console.error(e)
        }
    }
}
// class based lazy loading
class LazyLoader {
    constructor(container, elementsToRender, renderFn, options = {}) {
        const { batchSize = 10, freshRender, bottomFirst = false, domUpdated } = options

        this.elementsToRender = elementsToRender
        this.arrayOfElements = (typeof elementsToRender === 'function') ? this.elementsToRender() : elementsToRender || []
        this.renderFn = renderFn
        this.intersectionObserver

        this.batchSize = batchSize
        this.freshRender = freshRender
        this.domUpdated = domUpdated
        this.bottomFirst = bottomFirst

        this.shouldLazyLoad = false
        this.lastScrollTop = 0
        this.lastScrollHeight = 0

        this.lazyContainer = document.querySelector(container)

        this.update = this.update.bind(this)
        this.render = this.render.bind(this)
        this.init = this.init.bind(this)
        this.clear = this.clear.bind(this)
    }
    get elements() {
        return this.arrayOfElements
    }
    init() {
        this.intersectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.disconnect()
                    this.render({ lazyLoad: true })
                }
            })
        })
        this.mutationObserver = new MutationObserver(mutationList => {
            mutationList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    if (mutation.addedNodes.length) {
                        if (this.bottomFirst) {
                            if (this.lazyContainer.firstElementChild)
                                this.intersectionObserver.observe(this.lazyContainer.firstElementChild)
                        } else {
                            if (this.lazyContainer.lastElementChild)
                                this.intersectionObserver.observe(this.lazyContainer.lastElementChild)
                        }
                    }
                }
            })
        })
        this.mutationObserver.observe(this.lazyContainer, {
            childList: true,
        })
        this.render()
    }
    update(elementsToRender) {
        this.arrayOfElements = (typeof elementsToRender === 'function') ? this.elementsToRender() : elementsToRender || []
    }
    render(options = {}) {
        let { lazyLoad = false } = options
        this.shouldLazyLoad = lazyLoad
        const frag = document.createDocumentFragment();
        if (lazyLoad) {
            if (this.bottomFirst) {
                this.updateEndIndex = this.updateStartIndex
                this.updateStartIndex = this.updateEndIndex - this.batchSize
            } else {
                this.updateStartIndex = this.updateEndIndex
                this.updateEndIndex = this.updateEndIndex + this.batchSize
            }
        } else {
            this.intersectionObserver.disconnect()
            if (this.bottomFirst) {
                this.updateEndIndex = this.arrayOfElements.length
                this.updateStartIndex = this.updateEndIndex - this.batchSize - 1
            } else {
                this.updateStartIndex = 0
                this.updateEndIndex = this.batchSize
            }
            this.lazyContainer.innerHTML = ``;
        }
        this.lastScrollHeight = this.lazyContainer.scrollHeight
        this.lastScrollTop = this.lazyContainer.scrollTop
        this.arrayOfElements.slice(this.updateStartIndex, this.updateEndIndex).forEach((element, index) => {
            frag.append(this.renderFn(element))
        })
        if (this.bottomFirst) {
            this.lazyContainer.prepend(frag)
            // scroll anchoring for reverse scrolling
            this.lastScrollTop += this.lazyContainer.scrollHeight - this.lastScrollHeight
            this.lazyContainer.scrollTo({ top: this.lastScrollTop })
            this.lastScrollHeight = this.lazyContainer.scrollHeight
        } else {
            this.lazyContainer.append(frag)
        }
        if (!lazyLoad && this.bottomFirst) {
            this.lazyContainer.scrollTop = this.lazyContainer.scrollHeight
        }
        // Callback to be called if elements are updated or rendered for first time
        if (!lazyLoad && this.freshRender)
            this.freshRender()
    }
    clear() {
        this.intersectionObserver.disconnect()
        this.mutationObserver.disconnect()
        this.lazyContainer.innerHTML = ``;
    }
    reset() {
        this.arrayOfElements = (typeof this.elementsToRender === 'function') ? this.elementsToRender() : this.elementsToRender || []
        this.render()
    }
}

function buttonLoader(id, show) {
    const button = typeof id === 'string' ? document.getElementById(id) : id;
    if (!button) return
    if (!button.dataset.hasOwnProperty('wasDisabled'))
        button.dataset.wasDisabled = button.disabled
    const animOptions = {
        duration: 200,
        fill: 'forwards',
        easing: 'ease'
    }
    if (show) {
        button.disabled = true
        button.parentNode.append(document.createElement('sm-spinner'))
        button.animate([
            {
                clipPath: 'circle(100%)',
            },
            {
                clipPath: 'circle(0)',
            },
        ], animOptions)
    } else {
        button.disabled = button.dataset.wasDisabled === 'true';
        button.animate([
            {
                clipPath: 'circle(0)',
            },
            {
                clipPath: 'circle(100%)',
            },
        ], animOptions).onfinish = (e) => {
            button.removeAttribute('data-original-state')
        }
        const potentialTarget = button.parentNode.querySelector('sm-spinner')
        if (potentialTarget) potentialTarget.remove();
    }
}

let isMobileView = false
const mobileQuery = window.matchMedia('(max-width: 40rem)')
function handleMobileChange(e) {
    isMobileView = e.matches
}
mobileQuery.addEventListener('change', handleMobileChange)

handleMobileChange(mobileQuery)
const slideInLeft = [
    {
        opacity: 0,
        transform: 'translateX(1.5rem)'
    },
    {
        opacity: 1,
        transform: 'translateX(0)'
    }
]
const slideOutLeft = [
    {
        opacity: 1,
        transform: 'translateX(0)'
    },
    {
        opacity: 0,
        transform: 'translateX(-1.5rem)'
    },
]
const slideInRight = [
    {
        opacity: 0,
        transform: 'translateX(-1.5rem)'
    },
    {
        opacity: 1,
        transform: 'translateX(0)'
    }
]
const slideOutRight = [
    {
        opacity: 1,
        transform: 'translateX(0)'
    },
    {
        opacity: 0,
        transform: 'translateX(1.5rem)'
    },
]
const slideInDown = [
    {
        opacity: 0,
        transform: 'translateY(-1.5rem)'
    },
    {
        opacity: 1,
        transform: 'translateY(0)'
    },
]
const slideOutUp = [
    {
        opacity: 1,
        transform: 'translateY(0)'
    },
    {
        opacity: 0,
        transform: 'translateY(-1.5rem)'
    },
]
window.smCompConfig = {
    'sm-input': [
        {
            selector: '[data-flo-address]',
            customValidation: (value) => {
                if (!value) return { isValid: false, errorText: 'Please enter a FLO address' }
                return {
                    isValid: floCrypto.validateFloID(value),
                    errorText: `Invalid FLO address.<br> It usually starts with "F"`
                }
            }
        },
        {
            selector: '[data-btc-address]',
            customValidation: (value) => {
                if (!value) return { isValid: false, errorText: 'Please enter a BTC address' }
                return {
                    isValid: btcOperator.validateAddress(value),
                    errorText: `Invalid address.<br> It usually starts with "1", "3" or "bc1"`
                }
            }
        },
        {
            selector: '[data-private-key]',
            customValidation: (value, inputElem) => {
                if (!value) return { isValid: false, errorText: 'Please enter a private key' }
                if (floCrypto.getPubKeyHex(value)) {
                    const forAddress = inputElem.dataset.forAddress
                    if (!forAddress) return { isValid: true }
                    return {
                        isValid: btcOperator.verifyKey(forAddress, value),
                        errorText: `This private key does not match the address ${forAddress}`
                    }
                } else
                    return {
                        isValid: false,
                        errorText: `Invalid private key. Please check and try again.`
                    }
            }
        },
        {
            selector: '[type="email"]',
            customValidation: (value, target) => {
                if (value === '') {
                    return {
                        isValid: false,
                        errorText: 'Please enter an email address'
                    }
                }
                return {
                    isValid: /\S+@\S+\.\S+/.test(value),
                    errorText: `Invalid email address`
                }
            }
        }, {
            selector: '#profile__whatsapp_number',
            customValidation: (value, target) => {
                if (value.length < 10) return { isValid: false, errorText: 'Number must be at least 10 digits long' }
                if (value.length > 13) return { isValid: false, errorText: 'Number must be at most 13 digits long' }
                return { isValid: true }
            }
        }
    ]
}

async function saveProfile() {
    const name = getRef('profile__name').value.trim();
    const email = getRef('profile__email').value.trim();
    const college = getRef('profile__college').value.trim();
    const course = getRef('profile__course').value.trim();
    const whatsappNumber = getRef('profile__whatsapp_number').value.trim();
    const stringifiedData = JSON.stringify({ name, email, college, course, whatsappNumber });
    if (stringifiedData === floDapps.user.decipher(floGlobals.userProfile)) return notify('No changes detected', 'error')
    const confirmation = await getConfirmation('Save details', {
        message: 'Are you sure you want to save these details?',
        confirmText: 'Save'
    })
    if (!confirmation) return;
    const encryptedData = floDapps.user.encipher(stringifiedData);
    buttonLoader('profile__save', true)
    floCloudAPI.sendGeneralData({ encryptedData }, 'userProfile')
        .then(response => {
            notify('Profile saved successfully', 'success');
            floGlobals.userProfile = encryptedData;
        })
        .catch(e => {
            notify('An error occurred while saving the profile', 'error')
            console.error(e)
        }).finally(() => {
            buttonLoader('profile__save', false)
        })
}

async function startWorkingOnATask(id) {
    if (!floGlobals.isUserLoggedIn) {
        notify('You need to be logged in to start working on a task')
        location.hash = '#/sign_in';
        return
    }
    const confirmation = await getConfirmation('Start working on this task?', {
        message: `Other tasks won't be available until you finish this task, continue?`,
        confirmText: 'Start working'
    })
    if (!confirmation) return
    // send working on task acknowledgement
    floCloudAPI.sendGeneralData({ taskID: id }, 'taskApplications')
        .then(response => {
            notify('You can now start working on the task', 'success')
            floGlobals.applications.add(id)
            render.availableTasks();
        }).catch(e => {
            notify('An error occurred while sending the application', 'error')
            console.error(e)
        })
}

async function initSendingUpdate(id) {
    const updateType = signal('progress');
    let updateForm
    async function sendUpdate(id) {
        try {
            const consent = await getConfirmation('Send update', {
                message: 'Are you sure you want to send this update?',
                confirmText: 'Send'
            })
            if (!consent) return;
            console.log(updateType.value)
            if (updateType.value === 'status') {
                const status = getRef('send_update_popup__status__selector').value;
                console.log(status)
                if (status === 'in-progress') {
                    notify('Send status update only when the task is completed', 'error')
                    return
                }
            }
            buttonLoader('send_update_popup__submit', true)
            const message = getRef('update_field').value.trim();
            const update = {
                id,
                type: updateType.value,
                updateMessage: message
            }
            // send update
            await floCloudAPI.sendGeneralData(update, 'taskUpdates')
            notify('Update sent successfully', 'success')
            closePopup()
        } catch (e) {
            notify('An error occurred while sending the update', 'error')
            console.error(e)
        }
    }
    effect(() => {
        switch (updateType.value) {
            case 'progress':
                updateForm = html`
                    <div class="grid gap-0-5">    
                        <p class="label">What's the progress?</p>
                        <sm-textarea id="update_field" rows="6" required></sm-textarea>
                    </div>
                `
                break;
            case 'issue':
                updateForm = html`
                    <div class="grid gap-0-5">
                        <p class="label">What's the issue?</p>
                        <sm-textarea id="update_field" rows="6" required></sm-textarea>
                    </div>
                `
                break;
            case 'status':
                updateForm = html`
                    <div class="grid gap-0-5">
                        <p class="label">What's the status?</p>
                        <sm-chips id="send_update_popup__status__selector" class="margin-right-auto">
                            <sm-chip value="in-progress" selected>In progress</sm-chip>
                            <sm-chip value="completed">Completed</sm-chip>
                        </sm-chips>
                    </div>
                    <div class="grid gap-0-5">
                        <p class="label">Any additional details?</p>
                        <sm-textarea id="update_field" rows="6"></sm-textarea>
                    </div>
                `
                break;
        }
        renderElem(getRef('send_update_popup__content'), html`
            <sm-chips id="send_update_popup__chips" class="margin-right-auto" onchange=${(e) => updateType.value = e.target.value}>
                <sm-chip value="progress" selected>Progress</sm-chip>
                <sm-chip value="issue">Issue</sm-chip>
                <sm-chip value="status">Status</sm-chip>
            </sm-chips>
            <sm-form>
                ${updateForm}
                <div class="multi-state-button">
                    <button id="send_update_popup__submit" class="button button--primary" onclick=${() => sendUpdate(id)} type="submit">Send</button>
                </div>
            </sm-form>
        `)
    })
    openPopup('send_update_popup')
}

function editTask(details) {
    const { id, title, description, category, deadline } = details;
    getRef('task_popup__title_input').value = title;
    getRef('task_popup__description').value = description;
    getRef('task_popup__category').value = category;
    getRef('task_popup__deadline').value = deadline;
    getRef('task_popup').dataset.taskId = id;
    openPopup('task_popup')
}
async function saveTask() {
    const confirmation = await getConfirmation('Save task', {
        message: 'Are you sure you want to save this task?',
        confirmText: 'Save'
    })
    if (!confirmation) return;
    // save task
    const title = getRef('task_popup__title_input').value;
    const description = getRef('task_popup__description').value;
    const category = getRef('task_popup__category').value;
    const id = getRef('task_popup').dataset.taskId || category + '_' + Math.random().toString(36).substring(2, 9);
    const deadline = getRef('task_popup__deadline').value;
    const task = {
        id,
        title,
        description,
        category,
        deadline,
        status: 'open'
    }
    const foundTask = floGlobals.appObjects[category].tasks.find(task => task.id === id);
    if (foundTask) {
        let taskDetailsChanged = false;
        // edit task only if something has changed
        for (const key in task) {
            if (task[key] !== foundTask[key]) {
                taskDetailsChanged = true;
                foundTask[key] = task[key];
            }
        }
        if (!taskDetailsChanged)
            return notify('Please update at least one detail to save the changes', 'error')
    } else {
        task.date = Date.now();
        floGlobals.appObjects[category].tasks.unshift(task);
    }
    buttonLoader('task_popup__submit', true)
    floCloudAPI.updateObjectData(category)
        .then(response => {
            notify('Task saved successfully', 'success')
            render.availableTasks();
        })
        .catch(e => {
            notify('An error occurred while saving the task', 'error')
            console.error(e)
        }).finally(() => {
            buttonLoader('task_popup__submit', false)
            closePopup()
        })
}
async function deleteTask(id) {
    const confirmation = await getConfirmation('Delete task', {
        message: 'Are you sure you want to delete this task?',
        confirmText: 'Delete',
        danger: true
    })
    if (!confirmation) return;
    const [category] = id.split('_');
    const taskIndex = floGlobals.appObjects[category].tasks.findIndex(task => task.id === id);
    if (taskIndex < 0) return notify('Task not found', 'error');
    // in case of error, add the task back to the list
    const [cloneOfTaskToBeDeleted] = floGlobals.appObjects[category].tasks.splice(taskIndex, 1);
    floCloudAPI.updateObjectData(category)
        .then(response => {
            notify('Task deleted successfully', 'success')
        })
        .catch(e => {
            notify('An error occurred while deleting the task', 'error');
            // add the task back to the list
            floGlobals.appObjects[category].tasks.splice(taskIndex, 0, cloneOfTaskToBeDeleted);
        }).finally(() => {
            closePopup()
            render.availableTasks();
        })
}
const render = {
    task(details = {}) {
        const { title, description, date, id, status, deadline, category } = details;
        let actions = '';
        if (floGlobals.isUserLoggedIn) {
            if (floGlobals.isSubAdmin) {
                actions = html`
                    <button class="button button--outlined" onclick=${() => editTask(details)}>Edit</button>
                    <button class="button button--outlined" onclick=${() => deleteTask(id)}>Delete</button>
                    <a href=${`#/task?id=${id}`} class="button button--outlined margin-left-auto">See updates</a>
                `
            } else if (!floGlobals.isAdmin) {
                // check if user has already working on the task
                const isThisActive = floGlobals.applications.has(id);
                const hasAnyActiveTask = isThisActive || [...floGlobals.applications].some(id => {
                    const [category] = id.split('_');
                    return floGlobals.appObjects[category].tasks.some(task => floGlobals.applications.has(task.id))
                });
                if (isThisActive) {
                    actions = html`
                        <button class=${`button button--outlined`} data-task-id=${id} onclick=${() => initSendingUpdate(id)}>
                            Send update
                        </button>
                    `
                } else if (hasAnyActiveTask) {
                    actions = html`<button class="button button--outlined margin-left-auto" disabled>Unavailable</button>`
                } else {
                    actions = html`
                        <button class=${`button button--outlined`} data-task-id=${id} onclick=${() => startWorkingOnATask(id)}>
                            Start working
                        </button>
                    `
                }
            }
        } else {
            actions = html`<a href=${`#/sign_in`} class="button button--outlined margin-left-auto">Start working</a>`
            floGlobals.applyingForTask = id;
        }
        return html`
            <li class="task-card" .dataset=${{ id }}>
                <h4>${title}</h4>
                <sl-relative-time date=${date}></sl-relative-time>
                <p>${description}</p>
                <ul class="flex gap-0-3 flex-wrap">
                    <li>${floGlobals.taskCategories[category]}</li>
                    ${deadline ? html`<li>Complete <sl-relative-time date=${deadline}></sl-relative-time></li>` : ''}
                </ul>
                <div class="flex justify-end gap-0-3">
                    ${actions}
                </div>
            </li>
        `
    },
    availableTasks(options = {}) {
        if (floGlobals.isSubAdmin) {
            let availableTasks = Object.keys(floGlobals.taskCategories)
                .flatMap(category => floGlobals.appObjects[category].tasks)
                .map(render.task)
            if (availableTasks.length === 0)
                return renderElem(getRef('available_tasks_list'), html`<p>No tasks available</p>`);
            renderElem(getRef('available_tasks_list'), html`${availableTasks}`)
        } else if (!floGlobals.isAdmin) {
            const { type } = options;
            let availableTasks = [...floGlobals.interestedCategories || Object.keys(floGlobals.taskCategories)].flatMap(category =>
                floGlobals.appObjects[category].tasks
            )
            if (availableTasks.length === 0)
                return renderElem(getRef('available_tasks_list'), html`<p>No tasks available</p>`);
            if (type) {
                if (type === 'active')
                    availableTasks = availableTasks.filter(task => floGlobals.applications.has(task.id))
                else if (type === 'other')
                    availableTasks = availableTasks.filter(task => !floGlobals.applications.has(task.id))
            }
            renderElem(getRef('available_tasks_list'), html`${availableTasks.map(render.task)}`)
        }
    }
}

// routing logic
const router = new Router({
    routingStart(state) {
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);
    },
    routingEnd(state) {
        const { page, lastPage } = state
        if (lastPage !== page) {
            closePopup()
        }
    }
})
let userAddressTimeInterval;
let isShowingFloID = false;
const header = () => {
    const { page } = router.state
    const isUserLoggedIn = page === 'loading' || floGlobals.isUserLoggedIn;
    if (userAddressTimeInterval) clearInterval(userAddressTimeInterval);
    userAddressTimeInterval = setInterval(() => {
        if (!getRef('user_popup_button')) return;
        if (!isShowingFloID) {
            renderElem(getRef('user_popup_button'), html`
                <svg class="icon margin-right-0-5" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"> <mask id="path-1-outside-1_16_6" maskUnits="userSpaceOnUse" x="3" y="3" width="58" height="58"> <rect fill="white" x="3" y="3" width="58" height="58" /> <path fill-rule="evenodd" clip-rule="evenodd" d="M31.946 43.6019C28.8545 47.1308 28.7789 51.9719 31.9811 55.1957C35.0078 52.2797 35.0105 46.8446 31.946 43.6019ZM31.9487 10.6835C24.6452 19.1291 24.9206 29.1137 31.9433 37.4108C39.0929 28.9436 39.1118 19.0076 31.9487 10.6808V10.6835ZM37.1111 35.051C43.1861 28.841 50.5976 27.4208 59 28.7654C56.2919 34.9754 52.4714 39.9353 45.7214 42.53C47.2118 41.3609 48.5699 40.4051 49.7984 39.3089C51.8504 37.481 53.303 35.267 54.0293 32.6075C54.2588 31.7678 53.9618 31.5302 53.1896 31.406C50.3627 30.9524 47.7086 31.5464 45.1733 32.702C40.9073 34.646 37.4324 37.6403 34.1735 40.8938C34.1168 40.9532 34.0925 41.0396 33.9899 41.2259C40.3754 41.4689 45.2381 44.0177 48.119 49.9064C44.3768 50.738 40.9532 50.5625 37.778 48.5213C40.1702 49.2557 42.557 49.7903 45.176 48.5483C44.852 48.0083 44.663 47.3765 44.231 47.0228C43.0511 46.0589 41.8415 45.0842 40.505 44.3498C38.4395 43.2212 36.131 42.692 33.5768 42.1682C37.0247 48.2081 36.1607 53.6918 31.946 59C29.9858 56.5295 28.6142 53.9456 28.2389 50.8946C27.8609 47.8328 28.7222 45.0518 30.1991 42.3896C26.9321 41.8658 19.8824 45.6485 18.7916 48.5645C21.3215 49.8443 23.7893 49.2611 26.33 48.3161C24.5048 50.1953 19.2425 50.9648 15.8108 49.8335C18.6593 44.0285 23.4977 41.4716 30.0263 41.2286C29.5457 40.7426 29.1893 40.3673 28.8167 40.0082C26.1005 37.3892 23.2142 34.9862 19.823 33.2366C17.0501 31.8056 14.1422 30.9092 10.9481 31.3871C10.5701 31.4438 10.1948 31.5356 9.6656 31.6436C10.6376 36.6386 13.9856 39.7355 18.1274 42.3464C13.775 41.8199 6.431 34.214 5 28.7546C13.397 27.3938 20.849 28.8842 26.897 35.2319C21.8939 24.089 24.5561 14.2259 31.946 5C39.2765 14.153 41.9657 23.9459 37.1111 35.051" /> </mask> <path fill-rule="evenodd" clip-rule="evenodd" d="M31.946 43.6019C28.8545 47.1308 28.7789 51.9719 31.9811 55.1957C35.0078 52.2797 35.0105 46.8446 31.946 43.6019ZM31.9487 10.6835C24.6452 19.1291 24.9206 29.1137 31.9433 37.4108C39.0929 28.9436 39.1118 19.0076 31.9487 10.6808V10.6835ZM37.1111 35.051C43.1861 28.841 50.5976 27.4208 59 28.7654C56.2919 34.9754 52.4714 39.9353 45.7214 42.53C47.2118 41.3609 48.5699 40.4051 49.7984 39.3089C51.8504 37.481 53.303 35.267 54.0293 32.6075C54.2588 31.7678 53.9618 31.5302 53.1896 31.406C50.3627 30.9524 47.7086 31.5464 45.1733 32.702C40.9073 34.646 37.4324 37.6403 34.1735 40.8938C34.1168 40.9532 34.0925 41.0396 33.9899 41.2259C40.3754 41.4689 45.2381 44.0177 48.119 49.9064C44.3768 50.738 40.9532 50.5625 37.778 48.5213C40.1702 49.2557 42.557 49.7903 45.176 48.5483C44.852 48.0083 44.663 47.3765 44.231 47.0228C43.0511 46.0589 41.8415 45.0842 40.505 44.3498C38.4395 43.2212 36.131 42.692 33.5768 42.1682C37.0247 48.2081 36.1607 53.6918 31.946 59C29.9858 56.5295 28.6142 53.9456 28.2389 50.8946C27.8609 47.8328 28.7222 45.0518 30.1991 42.3896C26.9321 41.8658 19.8824 45.6485 18.7916 48.5645C21.3215 49.8443 23.7893 49.2611 26.33 48.3161C24.5048 50.1953 19.2425 50.9648 15.8108 49.8335C18.6593 44.0285 23.4977 41.4716 30.0263 41.2286C29.5457 40.7426 29.1893 40.3673 28.8167 40.0082C26.1005 37.3892 23.2142 34.9862 19.823 33.2366C17.0501 31.8056 14.1422 30.9092 10.9481 31.3871C10.5701 31.4438 10.1948 31.5356 9.6656 31.6436C10.6376 36.6386 13.9856 39.7355 18.1274 42.3464C13.775 41.8199 6.431 34.214 5 28.7546C13.397 27.3938 20.849 28.8842 26.897 35.2319C21.8939 24.089 24.5561 14.2259 31.946 5C39.2765 14.153 41.9657 23.9459 37.1111 35.051" /> <path d="M31.946 43.6019L32.6728 42.915L31.918 42.1163L31.1938 42.943L31.946 43.6019ZM31.9811 55.1957L31.2716 55.9004L31.9657 56.5992L32.6749 55.9159L31.9811 55.1957ZM31.9487 10.6835L32.7051 11.3376L32.9487 11.0559V10.6835H31.9487ZM31.9433 37.4108L31.18 38.0569L31.9442 38.9597L32.7074 38.056L31.9433 37.4108ZM31.9487 10.6808L32.7068 10.0287L30.9487 7.98495V10.6808H31.9487ZM59 28.7654L59.9166 29.1651L60.4326 27.9819L59.158 27.778L59 28.7654ZM45.7214 42.53L45.1042 41.7432L46.0802 43.4634L45.7214 42.53ZM49.7984 39.3089L49.1332 38.5622L49.1326 38.5628L49.7984 39.3089ZM54.0293 32.6075L53.0647 32.3439L53.0646 32.3441L54.0293 32.6075ZM53.1896 31.406L53.3484 30.4187L53.348 30.4186L53.1896 31.406ZM45.1733 32.702L45.588 33.612L45.5881 33.6119L45.1733 32.702ZM34.1735 40.8938L33.467 40.1861L33.4585 40.1946L33.4501 40.2033L34.1735 40.8938ZM33.9899 41.2259L33.114 40.7435L32.3319 42.1635L33.9519 42.2252L33.9899 41.2259ZM48.119 49.9064L48.3359 50.8826L49.5751 50.6072L49.0173 49.4669L48.119 49.9064ZM37.778 48.5213L38.0715 47.5653L37.2372 49.3625L37.778 48.5213ZM45.176 48.5483L45.6045 49.4518L46.6008 48.9794L46.0335 48.0338L45.176 48.5483ZM44.231 47.0228L44.8645 46.2491L44.8637 46.2484L44.231 47.0228ZM40.505 44.3498L40.9866 43.4734L40.9845 43.4723L40.505 44.3498ZM33.5768 42.1682L33.7777 41.1886L31.6127 40.7446L32.7083 42.664L33.5768 42.1682ZM31.946 59L31.1626 59.6216L31.9457 60.6085L32.7292 59.6218L31.946 59ZM28.2389 50.8946L29.2314 50.7725L29.2314 50.7721L28.2389 50.8946ZM30.1991 42.3896L31.0736 42.8747L31.7652 41.6279L30.3574 41.4022L30.1991 42.3896ZM18.7916 48.5645L17.855 48.2141L17.5413 49.0527L18.3402 49.4568L18.7916 48.5645ZM26.33 48.3161L27.0473 49.0128L25.9814 47.3788L26.33 48.3161ZM15.8108 49.8335L14.9131 49.393L14.4073 50.4237L15.4977 50.7832L15.8108 49.8335ZM30.0263 41.2286L30.0635 42.2279L32.3372 42.1433L30.7373 40.5255L30.0263 41.2286ZM28.8167 40.0082L28.1226 40.7281L28.1228 40.7282L28.8167 40.0082ZM19.823 33.2366L19.3644 34.1252L19.3645 34.1253L19.823 33.2366ZM10.9481 31.3871L10.8001 30.3981L10.7998 30.3982L10.9481 31.3871ZM9.6656 31.6436L9.46564 30.6638L8.49474 30.8619L8.68401 31.8346L9.6656 31.6436ZM18.1274 42.3464L18.0073 43.3392L18.6607 41.5005L18.1274 42.3464ZM5 28.7546L4.84003 27.7675L3.75363 27.9435L4.03268 29.0082L5 28.7546ZM26.897 35.2319L26.173 35.9217L27.8093 34.8223L26.897 35.2319ZM31.946 5L32.7265 4.37488L31.9461 3.40036L31.1655 4.37483L31.946 5ZM31.1938 42.943C27.7974 46.8199 27.6566 52.261 31.2716 55.9004L32.6906 54.491C29.9012 51.6828 29.9116 47.4417 32.6982 44.2609L31.1938 42.943ZM32.6749 55.9159C36.1304 52.5867 36.081 46.5214 32.6728 42.915L31.2192 44.2888C33.94 47.1678 33.8852 51.9727 31.2873 54.4755L32.6749 55.9159ZM31.1923 10.0294C27.4048 14.4092 25.5379 19.2455 25.5737 24.1102C25.6095 28.971 27.5438 33.7608 31.18 38.0569L32.7066 36.7647C29.3201 32.7637 27.6054 28.4127 27.5736 24.0955C27.5419 19.7822 29.1891 15.4034 32.7051 11.3376L31.1923 10.0294ZM32.7074 38.056C36.4083 33.6729 38.31 28.8504 38.3133 23.9938C38.3165 19.1359 36.42 14.3451 32.7068 10.0287L31.1906 11.3329C34.6405 15.3433 36.3161 19.6839 36.3133 23.9925C36.3104 28.3024 34.6279 32.6815 31.1792 36.7656L32.7074 38.056ZM30.9487 10.6808V10.6835H32.9487V10.6808H30.9487ZM37.8259 35.7503C43.6131 29.8345 50.6632 28.444 58.842 29.7528L59.158 27.778C50.532 26.3976 42.7591 27.8475 36.3963 34.3517L37.8259 35.7503ZM58.0834 28.3657C55.4402 34.4268 51.7791 39.1301 45.3626 41.5966L46.0802 43.4634C53.1637 40.7405 57.1436 35.524 59.9166 29.1651L58.0834 28.3657ZM46.3386 43.3168C47.7733 42.1914 49.2057 41.178 50.4642 40.055L49.1326 38.5628C47.9341 39.6322 46.6503 40.5304 45.1042 41.7432L46.3386 43.3168ZM50.4636 40.0556C52.6466 38.111 54.2121 35.7338 54.994 32.871L53.0646 32.3441C52.3939 34.8002 51.0542 36.851 49.1332 38.5622L50.4636 40.0556ZM54.9939 32.8711C55.1262 32.3872 55.2248 31.6946 54.7698 31.1186C54.3643 30.6053 53.7257 30.4794 53.3484 30.4187L53.0308 32.3933C53.1086 32.4058 53.17 32.4181 53.2184 32.43C53.2671 32.442 53.2955 32.4518 53.3091 32.4572C53.3227 32.4626 53.3139 32.4606 53.2926 32.4461C53.2699 32.4307 53.2353 32.4025 53.2004 32.3583C53.1832 32.3366 53.1677 32.3132 53.1543 32.2886C53.1409 32.264 53.1307 32.2402 53.1231 32.2182C53.1079 32.1742 53.1053 32.144 53.1049 32.1366C53.1046 32.1302 53.1059 32.1427 53.1007 32.1797C53.0955 32.2165 53.0849 32.27 53.0647 32.3439L54.9939 32.8711ZM53.348 30.4186C50.274 29.9254 47.4176 30.5801 44.7585 31.7921L45.5881 33.6119C47.9996 32.5127 50.4514 31.9794 53.0312 32.3934L53.348 30.4186ZM44.7586 31.792C40.3293 33.8104 36.7535 36.9051 33.467 40.1861L34.88 41.6015C38.1113 38.3755 41.4853 35.4816 45.588 33.612L44.7586 31.792ZM33.4501 40.2033C33.3063 40.354 33.2291 40.5156 33.2033 40.5674C33.1672 40.64 33.1517 40.6749 33.114 40.7435L34.8658 41.7083C34.9307 41.5906 34.9786 41.4891 34.9945 41.4572C35.0049 41.4363 35.0004 41.4467 34.9882 41.4667C34.9731 41.4914 34.9435 41.5355 34.8969 41.5843L33.4501 40.2033ZM33.9519 42.2252C37.0233 42.3421 39.6629 43.0109 41.8597 44.3098C44.0485 45.6039 45.857 47.5582 47.2207 50.3459L49.0173 49.4669C47.5001 46.3659 45.4368 44.1014 42.8776 42.5882C40.3265 41.0798 37.342 40.3527 34.0279 40.2266L33.9519 42.2252ZM47.9021 48.9302C44.3241 49.7253 41.1983 49.5313 38.3188 47.6801L37.2372 49.3625C40.7081 51.5937 44.4295 51.7507 48.3359 50.8826L47.9021 48.9302ZM37.4845 49.4773C39.9089 50.2215 42.6205 50.8669 45.6045 49.4518L44.7475 47.6448C42.4935 48.7137 40.4315 48.2899 38.0715 47.5653L37.4845 49.4773ZM46.0335 48.0338C45.8849 47.7862 45.8212 47.6158 45.6292 47.2504C45.4736 46.9544 45.2423 46.5584 44.8645 46.2491L43.5975 47.7965C43.6517 47.8409 43.7309 47.9377 43.8588 48.181C43.9503 48.3549 44.1431 48.7704 44.3185 49.0628L46.0335 48.0338ZM44.8637 46.2484C43.6913 45.2906 42.4149 44.2582 40.9866 43.4734L40.0234 45.2262C41.2681 45.9102 42.4109 46.8272 43.5983 47.7972L44.8637 46.2484ZM40.9845 43.4723C38.7711 42.2628 36.3236 41.7107 33.7777 41.1886L33.3759 43.1478C35.9384 43.6733 38.1079 44.1796 40.0255 45.2273L40.9845 43.4723ZM32.7083 42.664C34.346 45.5328 34.9255 48.203 34.6411 50.7474C34.3555 53.3015 33.1882 55.8274 31.1628 58.3782L32.7292 59.6218C34.9185 56.8644 36.2905 53.9944 36.6287 50.9696C36.9679 47.9351 36.2555 44.8435 34.4453 41.6724L32.7083 42.664ZM32.7294 58.3784C30.8397 55.9968 29.577 53.5818 29.2314 50.7725L27.2464 51.0167C27.6514 54.3094 29.1319 57.0622 31.1626 59.6216L32.7294 58.3784ZM29.2314 50.7721C28.8877 47.9881 29.6602 45.4224 31.0736 42.8747L29.3247 41.9045C27.7842 44.6812 26.8341 47.6775 27.2464 51.0171L29.2314 50.7721ZM30.3574 41.4022C29.3303 41.2375 28.1125 41.4187 26.9159 41.7622C25.6987 42.1117 24.4105 42.6564 23.2045 43.307C21.999 43.9574 20.8488 44.728 19.9166 45.543C19.005 46.3399 18.2137 47.2553 17.855 48.2141L19.7282 48.9149C19.9149 48.4157 20.4139 47.7647 21.233 47.0487C22.0314 46.3507 23.0524 45.6616 24.1541 45.0672C25.2552 44.4732 26.4102 43.9882 27.4678 43.6846C28.5458 43.3751 29.4344 43.2798 30.0408 43.377L30.3574 41.4022ZM18.3402 49.4568C21.2702 50.939 24.0958 50.214 26.6786 49.2534L25.9814 47.3788C23.4828 48.3082 21.3728 48.7496 19.243 47.6722L18.3402 49.4568ZM25.6127 47.6194C24.9334 48.3187 23.4333 48.9382 21.5294 49.2141C19.6667 49.484 17.6562 49.3889 16.1239 48.8838L15.4977 50.7832C17.3971 51.4094 19.7336 51.4952 21.8162 51.1934C23.8578 50.8976 25.9014 50.1927 27.0473 49.0128L25.6127 47.6194ZM16.7085 50.274C18.0554 47.5292 19.8486 45.5942 22.044 44.3081C24.2482 43.0169 26.918 42.345 30.0635 42.2279L29.9891 40.2293C26.606 40.3552 23.5923 41.0832 21.0331 42.5824C18.4649 44.0869 16.4147 46.3328 14.9131 49.393L16.7085 50.274ZM30.7373 40.5255C30.2757 40.0586 29.8942 39.6578 29.5106 39.2882L28.1228 40.7282C28.4844 41.0768 28.8157 41.4266 29.3153 41.9317L30.7373 40.5255ZM29.5108 39.2883C26.7637 36.6396 23.7967 34.1615 20.2815 32.3479L19.3645 34.1253C22.6317 35.8109 25.4373 38.1388 28.1226 40.7281L29.5108 39.2883ZM20.2816 32.348C17.4111 30.8666 14.2829 29.877 10.8001 30.3981L11.0961 32.3761C14.0015 31.9414 16.6891 32.7446 19.3644 34.1252L20.2816 32.348ZM10.7998 30.3982C10.388 30.4599 9.94468 30.566 9.46564 30.6638L9.86556 32.6234C10.4449 32.5052 10.7522 32.4277 11.0964 32.376L10.7998 30.3982ZM8.68401 31.8346C9.73479 37.2345 13.3673 40.5279 17.5941 43.1923L18.6607 41.5005C14.6039 38.9431 11.5404 36.0427 10.6472 31.4526L8.68401 31.8346ZM18.2475 41.3536C17.3819 41.2489 16.2594 40.7693 14.9918 39.9335C13.742 39.1093 12.427 37.9891 11.1875 36.7057C8.68437 34.1137 6.62095 30.9947 5.96732 28.5011L4.03268 29.0082C4.81005 31.9739 7.13413 35.3875 9.74885 38.095C11.0683 39.4613 12.4947 40.6825 13.8908 41.6031C15.2691 42.512 16.6967 43.1806 18.0073 43.3392L18.2475 41.3536ZM5.15997 29.7417C13.3246 28.4186 20.4108 29.874 26.173 35.9217L27.621 34.5421C21.2872 27.8944 13.4694 26.369 4.84003 27.7675L5.15997 29.7417ZM27.8093 34.8223C25.3851 29.4232 24.8341 24.3801 25.7561 19.5859C26.6809 14.7778 29.1009 10.1516 32.7265 5.62517L31.1655 4.37483C27.4012 9.07433 24.7952 13.9927 23.7921 19.2082C22.7863 24.4378 23.4058 29.8977 25.9847 35.6415L27.8093 34.8223ZM31.1655 5.62512C34.7619 10.1157 37.1747 14.7077 38.1168 19.4869C39.0562 24.2523 38.5469 29.2701 36.1948 34.6504L38.0274 35.4515C40.5299 29.7268 41.1033 24.2956 40.0791 19.1001C39.0576 13.9183 36.4606 9.03731 32.7265 4.37488L31.1655 5.62512Z" mask="url(#path-1-outside-1_16_6)" /> </svg>
                <div class="overflow-ellipsis">${floGlobals.myFloID}</div>
            `)
            isShowingFloID = true
        } else {
            renderElem(getRef('user_popup_button'), html`
                <svg class="icon margin-right-0-5" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><path d="M17.06,11.57C17.65,10.88,18,9.98,18,9c0-1.86-1.27-3.43-3-3.87L15,3h-2v2h-2V3H9v2H6v2h2v10H6v2h3v2h2v-2h2v2h2v-2 c2.21,0,4-1.79,4-4C19,13.55,18.22,12.27,17.06,11.57z M10,7h4c1.1,0,2,0.9,2,2s-0.9,2-2,2h-4V7z M15,17h-5v-4h5c1.1,0,2,0.9,2,2 S16.1,17,15,17z"/></g></svg>
                <div class="overflow-ellipsis">${floGlobals.myBtcID}</div>
            `)
            isShowingFloID = false
        }
    }, 1000 * 10);
    return html`
        <header id="main_header" class="flex align-center gap-1">
            <a href="#/" class="flex align-center gap-0-5" style="color: rgba(var(--text-color), 0.9);">
                <svg id="main_logo" class="icon" viewBox="0 0 27.25 32"> <title>RanchiMall</title> <path d="M27.14,30.86c-.74-2.48-3-4.36-8.25-6.94a20,20,0,0,1-4.2-2.49,6,6,0,0,1-1.25-1.67,4,4,0,0,1,0-2.26c.37-1.08.79-1.57,3.89-4.55a11.66,11.66,0,0,0,3.34-4.67,6.54,6.54,0,0,0,.05-2.82C20,3.6,18.58,2,16.16.49c-.89-.56-1.29-.64-1.3-.24a3,3,0,0,1-.3.72l-.3.55L13.42.94C13,.62,12.4.26,12.19.15c-.4-.2-.73-.18-.72.05a9.39,9.39,0,0,1-.61,1.33s-.14,0-.27-.13C8.76.09,8-.27,8,.23A11.73,11.73,0,0,1,6.76,2.6C4.81,5.87,2.83,7.49.77,7.49c-.89,0-.88,0-.61,1,.22.85.33.92,1.09.69A5.29,5.29,0,0,0,3,8.33c.23-.17.45-.29.49-.26a2,2,0,0,1,.22.63A1.31,1.31,0,0,0,4,9.34a5.62,5.62,0,0,0,2.27-.87L7,8l.13.55c.19.74.32.82,1,.65a7.06,7.06,0,0,0,3.46-2.47l.6-.71-.06.64c-.17,1.63-1.3,3.42-3.39,5.42L6.73,14c-3.21,3.06-3,5.59.6,8a46.77,46.77,0,0,0,4.6,2.41c.28.13,1,.52,1.59.87,3.31,2,4.95,3.92,4.95,5.93a2.49,2.49,0,0,0,.07.77h0c.09.09,0,.1.9-.14a2.61,2.61,0,0,0,.83-.32,3.69,3.69,0,0,0-.55-1.83A11.14,11.14,0,0,0,17,26.81a35.7,35.7,0,0,0-5.1-2.91C9.37,22.64,8.38,22,7.52,21.17a3.53,3.53,0,0,1-1.18-2.48c0-1.38.71-2.58,2.5-4.23,2.84-2.6,3.92-3.91,4.67-5.65a3.64,3.64,0,0,0,.42-2A3.37,3.37,0,0,0,13.61,5l-.32-.74.29-.48c.17-.27.37-.63.46-.8l.15-.3.44.64a5.92,5.92,0,0,1,1,2.81,5.86,5.86,0,0,1-.42,1.94c0,.12-.12.3-.15.4a9.49,9.49,0,0,1-.67,1.1,28,28,0,0,1-4,4.29C8.62,15.49,8.05,16.44,8,17.78a3.28,3.28,0,0,0,1.11,2.76c.95,1,2.07,1.74,5.25,3.32,3.64,1.82,5.22,2.9,6.41,4.38A4.78,4.78,0,0,1,21.94,31a3.21,3.21,0,0,0,.14.92,1.06,1.06,0,0,0,.43-.05l.83-.22.46-.12-.06-.46c-.21-1.53-1.62-3.25-3.94-4.8a37.57,37.57,0,0,0-5.22-2.82A13.36,13.36,0,0,1,11,21.19a3.36,3.36,0,0,1-.8-4.19c.41-.85.83-1.31,3.77-4.15,2.39-2.31,3.43-4.13,3.43-6a5.85,5.85,0,0,0-2.08-4.29c-.23-.21-.44-.43-.65-.65A2.5,2.5,0,0,1,15.27.69a10.6,10.6,0,0,1,2.91,2.78A4.16,4.16,0,0,1,19,6.16a4.91,4.91,0,0,1-.87,3c-.71,1.22-1.26,1.82-4.27,4.67a9.47,9.47,0,0,0-2.07,2.6,2.76,2.76,0,0,0-.33,1.54,2.76,2.76,0,0,0,.29,1.47c.57,1.21,2.23,2.55,4.65,3.73a32.41,32.41,0,0,1,5.82,3.24c2.16,1.6,3.2,3.16,3.2,4.8a1.94,1.94,0,0,0,.09.76,4.54,4.54,0,0,0,1.66-.4C27.29,31.42,27.29,31.37,27.14,30.86ZM6.1,7h0a3.77,3.77,0,0,1-1.46.45L4,7.51l.68-.83a25.09,25.09,0,0,0,3-4.82A12,12,0,0,1,8.28.76c.11-.12.77.32,1.53,1l.63.58-.57.84A10.34,10.34,0,0,1,6.1,7Zm5.71-1.78A9.77,9.77,0,0,1,9.24,7.18h0a5.25,5.25,0,0,1-1.17.28l-.58,0,.65-.78a21.29,21.29,0,0,0,2.1-3.12c.22-.41.42-.76.44-.79s.5.43.9,1.24L12,5ZM13.41,3a2.84,2.84,0,0,1-.45.64,11,11,0,0,1-.9-.91l-.84-.9.19-.45c.34-.79.39-.8,1-.31A9.4,9.4,0,0,1,13.8,2.33q-.18.34-.39.69Z"></path> </svg>
                ${!['landing', 'loading'].includes(page) ? html`
                    <div class="flex flex-direction-column hide-on-small" style="line-height: 1;">
                        <span style="font-size: 0.8rem;">RanchiMall</span>
                        <span style="font-weight: 500;">Selects</span>
                    </div>
                ` : ''}
            </a>
            <theme-toggle class="margin-left-auto"></theme-toggle>
            ${isUserLoggedIn ? page !== 'loading' ? html`
                <button id="user_popup_button" class="user-content button--small" onclick=${() => openPopup('profile_popup')}>
                    <svg class="icon margin-right-0-5" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"> <mask id="path-1-outside-1_16_6" maskUnits="userSpaceOnUse" x="3" y="3" width="58" height="58"> <rect fill="white" x="3" y="3" width="58" height="58" /> <path fill-rule="evenodd" clip-rule="evenodd" d="M31.946 43.6019C28.8545 47.1308 28.7789 51.9719 31.9811 55.1957C35.0078 52.2797 35.0105 46.8446 31.946 43.6019ZM31.9487 10.6835C24.6452 19.1291 24.9206 29.1137 31.9433 37.4108C39.0929 28.9436 39.1118 19.0076 31.9487 10.6808V10.6835ZM37.1111 35.051C43.1861 28.841 50.5976 27.4208 59 28.7654C56.2919 34.9754 52.4714 39.9353 45.7214 42.53C47.2118 41.3609 48.5699 40.4051 49.7984 39.3089C51.8504 37.481 53.303 35.267 54.0293 32.6075C54.2588 31.7678 53.9618 31.5302 53.1896 31.406C50.3627 30.9524 47.7086 31.5464 45.1733 32.702C40.9073 34.646 37.4324 37.6403 34.1735 40.8938C34.1168 40.9532 34.0925 41.0396 33.9899 41.2259C40.3754 41.4689 45.2381 44.0177 48.119 49.9064C44.3768 50.738 40.9532 50.5625 37.778 48.5213C40.1702 49.2557 42.557 49.7903 45.176 48.5483C44.852 48.0083 44.663 47.3765 44.231 47.0228C43.0511 46.0589 41.8415 45.0842 40.505 44.3498C38.4395 43.2212 36.131 42.692 33.5768 42.1682C37.0247 48.2081 36.1607 53.6918 31.946 59C29.9858 56.5295 28.6142 53.9456 28.2389 50.8946C27.8609 47.8328 28.7222 45.0518 30.1991 42.3896C26.9321 41.8658 19.8824 45.6485 18.7916 48.5645C21.3215 49.8443 23.7893 49.2611 26.33 48.3161C24.5048 50.1953 19.2425 50.9648 15.8108 49.8335C18.6593 44.0285 23.4977 41.4716 30.0263 41.2286C29.5457 40.7426 29.1893 40.3673 28.8167 40.0082C26.1005 37.3892 23.2142 34.9862 19.823 33.2366C17.0501 31.8056 14.1422 30.9092 10.9481 31.3871C10.5701 31.4438 10.1948 31.5356 9.6656 31.6436C10.6376 36.6386 13.9856 39.7355 18.1274 42.3464C13.775 41.8199 6.431 34.214 5 28.7546C13.397 27.3938 20.849 28.8842 26.897 35.2319C21.8939 24.089 24.5561 14.2259 31.946 5C39.2765 14.153 41.9657 23.9459 37.1111 35.051" /> </mask> <path fill-rule="evenodd" clip-rule="evenodd" d="M31.946 43.6019C28.8545 47.1308 28.7789 51.9719 31.9811 55.1957C35.0078 52.2797 35.0105 46.8446 31.946 43.6019ZM31.9487 10.6835C24.6452 19.1291 24.9206 29.1137 31.9433 37.4108C39.0929 28.9436 39.1118 19.0076 31.9487 10.6808V10.6835ZM37.1111 35.051C43.1861 28.841 50.5976 27.4208 59 28.7654C56.2919 34.9754 52.4714 39.9353 45.7214 42.53C47.2118 41.3609 48.5699 40.4051 49.7984 39.3089C51.8504 37.481 53.303 35.267 54.0293 32.6075C54.2588 31.7678 53.9618 31.5302 53.1896 31.406C50.3627 30.9524 47.7086 31.5464 45.1733 32.702C40.9073 34.646 37.4324 37.6403 34.1735 40.8938C34.1168 40.9532 34.0925 41.0396 33.9899 41.2259C40.3754 41.4689 45.2381 44.0177 48.119 49.9064C44.3768 50.738 40.9532 50.5625 37.778 48.5213C40.1702 49.2557 42.557 49.7903 45.176 48.5483C44.852 48.0083 44.663 47.3765 44.231 47.0228C43.0511 46.0589 41.8415 45.0842 40.505 44.3498C38.4395 43.2212 36.131 42.692 33.5768 42.1682C37.0247 48.2081 36.1607 53.6918 31.946 59C29.9858 56.5295 28.6142 53.9456 28.2389 50.8946C27.8609 47.8328 28.7222 45.0518 30.1991 42.3896C26.9321 41.8658 19.8824 45.6485 18.7916 48.5645C21.3215 49.8443 23.7893 49.2611 26.33 48.3161C24.5048 50.1953 19.2425 50.9648 15.8108 49.8335C18.6593 44.0285 23.4977 41.4716 30.0263 41.2286C29.5457 40.7426 29.1893 40.3673 28.8167 40.0082C26.1005 37.3892 23.2142 34.9862 19.823 33.2366C17.0501 31.8056 14.1422 30.9092 10.9481 31.3871C10.5701 31.4438 10.1948 31.5356 9.6656 31.6436C10.6376 36.6386 13.9856 39.7355 18.1274 42.3464C13.775 41.8199 6.431 34.214 5 28.7546C13.397 27.3938 20.849 28.8842 26.897 35.2319C21.8939 24.089 24.5561 14.2259 31.946 5C39.2765 14.153 41.9657 23.9459 37.1111 35.051" /> <path d="M31.946 43.6019L32.6728 42.915L31.918 42.1163L31.1938 42.943L31.946 43.6019ZM31.9811 55.1957L31.2716 55.9004L31.9657 56.5992L32.6749 55.9159L31.9811 55.1957ZM31.9487 10.6835L32.7051 11.3376L32.9487 11.0559V10.6835H31.9487ZM31.9433 37.4108L31.18 38.0569L31.9442 38.9597L32.7074 38.056L31.9433 37.4108ZM31.9487 10.6808L32.7068 10.0287L30.9487 7.98495V10.6808H31.9487ZM59 28.7654L59.9166 29.1651L60.4326 27.9819L59.158 27.778L59 28.7654ZM45.7214 42.53L45.1042 41.7432L46.0802 43.4634L45.7214 42.53ZM49.7984 39.3089L49.1332 38.5622L49.1326 38.5628L49.7984 39.3089ZM54.0293 32.6075L53.0647 32.3439L53.0646 32.3441L54.0293 32.6075ZM53.1896 31.406L53.3484 30.4187L53.348 30.4186L53.1896 31.406ZM45.1733 32.702L45.588 33.612L45.5881 33.6119L45.1733 32.702ZM34.1735 40.8938L33.467 40.1861L33.4585 40.1946L33.4501 40.2033L34.1735 40.8938ZM33.9899 41.2259L33.114 40.7435L32.3319 42.1635L33.9519 42.2252L33.9899 41.2259ZM48.119 49.9064L48.3359 50.8826L49.5751 50.6072L49.0173 49.4669L48.119 49.9064ZM37.778 48.5213L38.0715 47.5653L37.2372 49.3625L37.778 48.5213ZM45.176 48.5483L45.6045 49.4518L46.6008 48.9794L46.0335 48.0338L45.176 48.5483ZM44.231 47.0228L44.8645 46.2491L44.8637 46.2484L44.231 47.0228ZM40.505 44.3498L40.9866 43.4734L40.9845 43.4723L40.505 44.3498ZM33.5768 42.1682L33.7777 41.1886L31.6127 40.7446L32.7083 42.664L33.5768 42.1682ZM31.946 59L31.1626 59.6216L31.9457 60.6085L32.7292 59.6218L31.946 59ZM28.2389 50.8946L29.2314 50.7725L29.2314 50.7721L28.2389 50.8946ZM30.1991 42.3896L31.0736 42.8747L31.7652 41.6279L30.3574 41.4022L30.1991 42.3896ZM18.7916 48.5645L17.855 48.2141L17.5413 49.0527L18.3402 49.4568L18.7916 48.5645ZM26.33 48.3161L27.0473 49.0128L25.9814 47.3788L26.33 48.3161ZM15.8108 49.8335L14.9131 49.393L14.4073 50.4237L15.4977 50.7832L15.8108 49.8335ZM30.0263 41.2286L30.0635 42.2279L32.3372 42.1433L30.7373 40.5255L30.0263 41.2286ZM28.8167 40.0082L28.1226 40.7281L28.1228 40.7282L28.8167 40.0082ZM19.823 33.2366L19.3644 34.1252L19.3645 34.1253L19.823 33.2366ZM10.9481 31.3871L10.8001 30.3981L10.7998 30.3982L10.9481 31.3871ZM9.6656 31.6436L9.46564 30.6638L8.49474 30.8619L8.68401 31.8346L9.6656 31.6436ZM18.1274 42.3464L18.0073 43.3392L18.6607 41.5005L18.1274 42.3464ZM5 28.7546L4.84003 27.7675L3.75363 27.9435L4.03268 29.0082L5 28.7546ZM26.897 35.2319L26.173 35.9217L27.8093 34.8223L26.897 35.2319ZM31.946 5L32.7265 4.37488L31.9461 3.40036L31.1655 4.37483L31.946 5ZM31.1938 42.943C27.7974 46.8199 27.6566 52.261 31.2716 55.9004L32.6906 54.491C29.9012 51.6828 29.9116 47.4417 32.6982 44.2609L31.1938 42.943ZM32.6749 55.9159C36.1304 52.5867 36.081 46.5214 32.6728 42.915L31.2192 44.2888C33.94 47.1678 33.8852 51.9727 31.2873 54.4755L32.6749 55.9159ZM31.1923 10.0294C27.4048 14.4092 25.5379 19.2455 25.5737 24.1102C25.6095 28.971 27.5438 33.7608 31.18 38.0569L32.7066 36.7647C29.3201 32.7637 27.6054 28.4127 27.5736 24.0955C27.5419 19.7822 29.1891 15.4034 32.7051 11.3376L31.1923 10.0294ZM32.7074 38.056C36.4083 33.6729 38.31 28.8504 38.3133 23.9938C38.3165 19.1359 36.42 14.3451 32.7068 10.0287L31.1906 11.3329C34.6405 15.3433 36.3161 19.6839 36.3133 23.9925C36.3104 28.3024 34.6279 32.6815 31.1792 36.7656L32.7074 38.056ZM30.9487 10.6808V10.6835H32.9487V10.6808H30.9487ZM37.8259 35.7503C43.6131 29.8345 50.6632 28.444 58.842 29.7528L59.158 27.778C50.532 26.3976 42.7591 27.8475 36.3963 34.3517L37.8259 35.7503ZM58.0834 28.3657C55.4402 34.4268 51.7791 39.1301 45.3626 41.5966L46.0802 43.4634C53.1637 40.7405 57.1436 35.524 59.9166 29.1651L58.0834 28.3657ZM46.3386 43.3168C47.7733 42.1914 49.2057 41.178 50.4642 40.055L49.1326 38.5628C47.9341 39.6322 46.6503 40.5304 45.1042 41.7432L46.3386 43.3168ZM50.4636 40.0556C52.6466 38.111 54.2121 35.7338 54.994 32.871L53.0646 32.3441C52.3939 34.8002 51.0542 36.851 49.1332 38.5622L50.4636 40.0556ZM54.9939 32.8711C55.1262 32.3872 55.2248 31.6946 54.7698 31.1186C54.3643 30.6053 53.7257 30.4794 53.3484 30.4187L53.0308 32.3933C53.1086 32.4058 53.17 32.4181 53.2184 32.43C53.2671 32.442 53.2955 32.4518 53.3091 32.4572C53.3227 32.4626 53.3139 32.4606 53.2926 32.4461C53.2699 32.4307 53.2353 32.4025 53.2004 32.3583C53.1832 32.3366 53.1677 32.3132 53.1543 32.2886C53.1409 32.264 53.1307 32.2402 53.1231 32.2182C53.1079 32.1742 53.1053 32.144 53.1049 32.1366C53.1046 32.1302 53.1059 32.1427 53.1007 32.1797C53.0955 32.2165 53.0849 32.27 53.0647 32.3439L54.9939 32.8711ZM53.348 30.4186C50.274 29.9254 47.4176 30.5801 44.7585 31.7921L45.5881 33.6119C47.9996 32.5127 50.4514 31.9794 53.0312 32.3934L53.348 30.4186ZM44.7586 31.792C40.3293 33.8104 36.7535 36.9051 33.467 40.1861L34.88 41.6015C38.1113 38.3755 41.4853 35.4816 45.588 33.612L44.7586 31.792ZM33.4501 40.2033C33.3063 40.354 33.2291 40.5156 33.2033 40.5674C33.1672 40.64 33.1517 40.6749 33.114 40.7435L34.8658 41.7083C34.9307 41.5906 34.9786 41.4891 34.9945 41.4572C35.0049 41.4363 35.0004 41.4467 34.9882 41.4667C34.9731 41.4914 34.9435 41.5355 34.8969 41.5843L33.4501 40.2033ZM33.9519 42.2252C37.0233 42.3421 39.6629 43.0109 41.8597 44.3098C44.0485 45.6039 45.857 47.5582 47.2207 50.3459L49.0173 49.4669C47.5001 46.3659 45.4368 44.1014 42.8776 42.5882C40.3265 41.0798 37.342 40.3527 34.0279 40.2266L33.9519 42.2252ZM47.9021 48.9302C44.3241 49.7253 41.1983 49.5313 38.3188 47.6801L37.2372 49.3625C40.7081 51.5937 44.4295 51.7507 48.3359 50.8826L47.9021 48.9302ZM37.4845 49.4773C39.9089 50.2215 42.6205 50.8669 45.6045 49.4518L44.7475 47.6448C42.4935 48.7137 40.4315 48.2899 38.0715 47.5653L37.4845 49.4773ZM46.0335 48.0338C45.8849 47.7862 45.8212 47.6158 45.6292 47.2504C45.4736 46.9544 45.2423 46.5584 44.8645 46.2491L43.5975 47.7965C43.6517 47.8409 43.7309 47.9377 43.8588 48.181C43.9503 48.3549 44.1431 48.7704 44.3185 49.0628L46.0335 48.0338ZM44.8637 46.2484C43.6913 45.2906 42.4149 44.2582 40.9866 43.4734L40.0234 45.2262C41.2681 45.9102 42.4109 46.8272 43.5983 47.7972L44.8637 46.2484ZM40.9845 43.4723C38.7711 42.2628 36.3236 41.7107 33.7777 41.1886L33.3759 43.1478C35.9384 43.6733 38.1079 44.1796 40.0255 45.2273L40.9845 43.4723ZM32.7083 42.664C34.346 45.5328 34.9255 48.203 34.6411 50.7474C34.3555 53.3015 33.1882 55.8274 31.1628 58.3782L32.7292 59.6218C34.9185 56.8644 36.2905 53.9944 36.6287 50.9696C36.9679 47.9351 36.2555 44.8435 34.4453 41.6724L32.7083 42.664ZM32.7294 58.3784C30.8397 55.9968 29.577 53.5818 29.2314 50.7725L27.2464 51.0167C27.6514 54.3094 29.1319 57.0622 31.1626 59.6216L32.7294 58.3784ZM29.2314 50.7721C28.8877 47.9881 29.6602 45.4224 31.0736 42.8747L29.3247 41.9045C27.7842 44.6812 26.8341 47.6775 27.2464 51.0171L29.2314 50.7721ZM30.3574 41.4022C29.3303 41.2375 28.1125 41.4187 26.9159 41.7622C25.6987 42.1117 24.4105 42.6564 23.2045 43.307C21.999 43.9574 20.8488 44.728 19.9166 45.543C19.005 46.3399 18.2137 47.2553 17.855 48.2141L19.7282 48.9149C19.9149 48.4157 20.4139 47.7647 21.233 47.0487C22.0314 46.3507 23.0524 45.6616 24.1541 45.0672C25.2552 44.4732 26.4102 43.9882 27.4678 43.6846C28.5458 43.3751 29.4344 43.2798 30.0408 43.377L30.3574 41.4022ZM18.3402 49.4568C21.2702 50.939 24.0958 50.214 26.6786 49.2534L25.9814 47.3788C23.4828 48.3082 21.3728 48.7496 19.243 47.6722L18.3402 49.4568ZM25.6127 47.6194C24.9334 48.3187 23.4333 48.9382 21.5294 49.2141C19.6667 49.484 17.6562 49.3889 16.1239 48.8838L15.4977 50.7832C17.3971 51.4094 19.7336 51.4952 21.8162 51.1934C23.8578 50.8976 25.9014 50.1927 27.0473 49.0128L25.6127 47.6194ZM16.7085 50.274C18.0554 47.5292 19.8486 45.5942 22.044 44.3081C24.2482 43.0169 26.918 42.345 30.0635 42.2279L29.9891 40.2293C26.606 40.3552 23.5923 41.0832 21.0331 42.5824C18.4649 44.0869 16.4147 46.3328 14.9131 49.393L16.7085 50.274ZM30.7373 40.5255C30.2757 40.0586 29.8942 39.6578 29.5106 39.2882L28.1228 40.7282C28.4844 41.0768 28.8157 41.4266 29.3153 41.9317L30.7373 40.5255ZM29.5108 39.2883C26.7637 36.6396 23.7967 34.1615 20.2815 32.3479L19.3645 34.1253C22.6317 35.8109 25.4373 38.1388 28.1226 40.7281L29.5108 39.2883ZM20.2816 32.348C17.4111 30.8666 14.2829 29.877 10.8001 30.3981L11.0961 32.3761C14.0015 31.9414 16.6891 32.7446 19.3644 34.1252L20.2816 32.348ZM10.7998 30.3982C10.388 30.4599 9.94468 30.566 9.46564 30.6638L9.86556 32.6234C10.4449 32.5052 10.7522 32.4277 11.0964 32.376L10.7998 30.3982ZM8.68401 31.8346C9.73479 37.2345 13.3673 40.5279 17.5941 43.1923L18.6607 41.5005C14.6039 38.9431 11.5404 36.0427 10.6472 31.4526L8.68401 31.8346ZM18.2475 41.3536C17.3819 41.2489 16.2594 40.7693 14.9918 39.9335C13.742 39.1093 12.427 37.9891 11.1875 36.7057C8.68437 34.1137 6.62095 30.9947 5.96732 28.5011L4.03268 29.0082C4.81005 31.9739 7.13413 35.3875 9.74885 38.095C11.0683 39.4613 12.4947 40.6825 13.8908 41.6031C15.2691 42.512 16.6967 43.1806 18.0073 43.3392L18.2475 41.3536ZM5.15997 29.7417C13.3246 28.4186 20.4108 29.874 26.173 35.9217L27.621 34.5421C21.2872 27.8944 13.4694 26.369 4.84003 27.7675L5.15997 29.7417ZM27.8093 34.8223C25.3851 29.4232 24.8341 24.3801 25.7561 19.5859C26.6809 14.7778 29.1009 10.1516 32.7265 5.62517L31.1655 4.37483C27.4012 9.07433 24.7952 13.9927 23.7921 19.2082C22.7863 24.4378 23.4058 29.8977 25.9847 35.6415L27.8093 34.8223ZM31.1655 5.62512C34.7619 10.1157 37.1747 14.7077 38.1168 19.4869C39.0562 24.2523 38.5469 29.2701 36.1948 34.6504L38.0274 35.4515C40.5299 29.7268 41.1033 24.2956 40.0791 19.1001C39.0576 13.9183 36.4606 9.03731 32.7265 4.37488L31.1655 5.62512Z" mask="url(#path-1-outside-1_16_6)" /> </svg>
                    <div id="user_profile_id" class="overflow-ellipsis">${floGlobals.myFloID}</div>
                </button>
            `: '' : html`
                <div class="flex gap-0-5">
                    ${page !== 'sign_up' ? html`<a class="button button--outlined" href="#/sign_up">Get Started</a>` : ''}
                    ${page !== 'sign_in' ? html`<a class="button button--primary" href="#/sign_in">Sign in</a>` : ''}
                </div>
            `}
        </header>
    `;
}
router.addRoute('loading', (state) => {
    renderElem(getRef('app_body'), html`
        <article id="loading">
            ${header()}
            <section class="grid justify-content-center">
                <sm-spinner></sm-spinner>
                <div class="grid gap-1 justify-items-center">
                    <h4>Loading RanchiMall Selects</h4>
                    <button class="button button--colored" onclick=${signOut}>Reset</button>
                </div>
            </section>
        </article>
    `);
})
router.addRoute('landing', async (state) => {
    try {
        const { page } = state;
        if (floGlobals.interestedCategories.size) {
            await Promise.all(
                Object.keys(floGlobals.taskCategories).map(category => floCloudAPI.requestObjectData(category))
            )
        }
        renderElem(getRef('app_body'), html`
            <article id="landing">
                ${header()}
                ${floGlobals.interestedCategories.size === 0 ? html`
                    <section id="category_selection" class="grid justify-content-center">
                        <div class="grid">
                            <h1>
                                <span>Welcome to</span> <br> RanchiMall Selects
                            </h1>
                            <p>
                                Select the categories you are interested in <br> and we will show you the tasks available in those categories
                            </p>
                        </div>
                        <ul id="category_list" class="grid gap-0-5">
                            ${Object.keys(floGlobals.taskCategories).map((category, index) => html`
                                <li class="flex align-center gap-0-5" style=${`--delay: ${index * 0.1}s`}>
                                    <input type="checkbox" id=${category} onchange=${(e) => toggleCategory(e, category)}>
                                    <label class="interactive" for=${category}>${floGlobals.taskCategories[category]}</label>
                                </li>
                            `)}
                        </ul>
                        <button class="button button--primary" onclick=${() => saveCategories()}>
                            <span>Next</span>
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
                        </button>
                    </section>
                ` : html`
                    <section id="relative_tasks" class="flex flex-wrap">
                        <div>
                            <h1 class="grid">
                                <span>
                                    Internship
                                </span>
                                <span>
                                    @ RanchiMall
                                </span>
                            </h1>
                            <svg id="emblem" width="77" height="77" viewBox="0 0 77 77" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="38.4806" cy="29.7768" r="29.1831"/> <circle cx="38.4806" cy="47.2232" r="29.1831"/> <circle cx="47.2038" cy="38.5" r="29.1831" transform="rotate(90 47.2038 38.5)"/> <circle cx="29.7574" cy="38.5" r="29.1831" transform="rotate(90 29.7574 38.5)"/> </svg>
                        </div>
                        <div class="flex flex-direction-column gap-1-5 w-100" style="min-width: 12rem">
                            <h4>Available</h4>
                            <ul id="available_tasks_list" class="grid">
                                <sm-spinner></sm-spinner>
                            </ul>
                        </div>
                    </section>
                `}
            </article>
        `)
        if (floGlobals.interestedCategories.size > 0)
            render.availableTasks()
    } catch (err) {
        notify(err, 'error')
    }
})

function toggleCategory(e, category) {
    if (e.target.checked) {
        floGlobals.interestedCategories.add(category)
    } else {
        floGlobals.interestedCategories.delete(category)
    }
}

function saveCategories() {
    if (floGlobals.interestedCategories.size === 0)
        return notify('Please select at least one category', 'error', {
            timeout: 5000
        })
    localStorage.setItem('interestedCategories', JSON.stringify([...floGlobals.interestedCategories]));
    router.routeTo('landing');
}

function handleSignIn() {
    privKeyResolver(getRef('private_key_field').value.trim());
    router.routeTo('loading');
}
router.addRoute('sign_in', (state) => {
    const { } = state;
    let dataset = {}
    if (!floGlobals.isPrivKeySecured)
        dataset.privateKey = ''
    renderElem(getRef('app_body'), html`
        <article id="sign_in">
            ${header()}
            <section>
                <h1 style="font-size: 2rem;">Sign in</h1>
                <p>Welcome back, glad to see you again</p>
                <sm-form id="sign_in_form">
                    <sm-input id="private_key_field" class="password-field" type="password" .dataset=${dataset}
                        placeholder=${`${floGlobals.isPrivKeySecured ? 'Password' : 'FLO/BTC private key'}`} error-text="Private key is invalid" required>
                        <label slot="right" class="interact">
                            <input type="checkbox" class="hidden" autocomplete="off" readonly
                                onchange="togglePrivateKeyVisibility(this)">
                            <svg class="icon invisible" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"> <title>Hide password</title> <path d="M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z" fill="none" /> <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" /> </svg>
                            <svg class="icon visible" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"> <title>Show password</title> <path d="M0 0h24v24H0z" fill="none" /> <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /> </svg>
                        </label>
                    </sm-input>
                    <button id="sign_in_button" onclick="handleSignIn()" class="button button--primary" type="submit" disabled>Sign in</button>
                </sm-form>
                <p>
                    New here? <a href="#/sign_up">get your FLO login credentials</a>
                </p>
            </section>
        </article>
    `);
    getRef('private_key_field').focusIn();
})
function handleSignUp() {
    const privKey = getRef('generated_private_key').value.trim();
    privKeyResolver(privKey);
    router.routeTo('loading');
}
router.addRoute('sign_up', (state) => {
    const { floID, privKey } = floCrypto.generateNewID()
    renderElem(getRef('app_body'), html`
        <article id="sign_up">
            ${header()}
            <section class="grid gap-1-5">
                <div id="flo_id_warning" class="flex gap-1">
                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"> <path d="M0 0h24v24H0z" fill="none" /> <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /> </svg>
                    <div class="grid gap-0-5">
                        <strong>
                            <h3> Keep your keys safe! </h3>
                        </strong>
                        <p>Don't share with anyone. Once lost private key can't be recovered.</p>
                    </div>
                </div>
                <div class="grid gap-1-5 generated-keys-wrapper">
                    <div class="grid gap-0-5">
                        <h5>FLO address</h5>
                        <sm-copy id="generated_flo_address" value=${floID}></sm-copy>
                    </div>
                    <div class="grid gap-0-5">
                        <h5>Private key</h5>
                        <sm-copy id="generated_private_key" value=${privKey}></sm-copy>
                    </div>
                </div>
                <button id="sign_up_button" onclick="handleSignUp()" class="button button--primary w-100">Sign in with these credentials</button>
                <p class="margin-top-1">You can use these FLO credentials with other RanchiMall apps too. </p>
            </section>
        </article>
    `);
})

function handleSubAdminViewChange(e) {
    location.hash = `#/home?view=${e.target.value}`
}
router.addRoute('', renderHome)
router.addRoute('home', renderHome)

function renderHome(state) {
    if (!floGlobals.isUserLoggedIn) {
        router.routeTo('landing');
        return;
    }
    if (floGlobals.isAdmin) {

    } else if (floGlobals.isSubAdmin) {
        const { } = state;
        renderElem(getRef('app_body'), html`
            <article id="home">
                ${header()}
                <section class="grid gap-1">
                    
                    <div class="flex align-center space-between">
                        <h5>Tasks</h5>
                        <button class="button button--primary margin-left-auto gap-0-5" onclick=${() => openPopup('task_popup')}>
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                            Add Task
                        </button>
                    </div>
                    <ul id="available_tasks_list" class="grid">
                        <sm-spinner></sm-spinner>
                    </ul>
                </section>
            </article>
        `)
        getRef('task_popup__title').textContent = 'Add Task';
        render.availableTasks()
    } else {
        const { params: { view = floGlobals.applications?.size ? 'active' : 'other' } } = state;
        if (floGlobals.applyingForTask) {
            startWorkingOnATask(floGlobals.applyingForTask)
            floGlobals.applyingForTask = null;
        } else {
            renderElem(getRef('app_body'), html`
                <article id="home">
                    ${header()}
                    <section class="grid gap-1">
                        <h2>Task</h2>
                        <div class="flex flex-direction-column gap-1-5">
                            ${floGlobals.applications?.size > 0 ? html`
                                <sm-chips class="margin-right-auto" onchange=${handleViewChange}>
                                    <sm-chip value="active" ?selected=${view === 'active'}>Active</sm-chip>
                                    <sm-chip value="other" ?selected=${view === 'other'}>Other</sm-chip>
                                </sm-chips>
                            ` : html`
                                <h4>Available</h4>
                            `}
                            <ul id="available_tasks_list" class="grid">
                                <sm-spinner></sm-spinner>
                            </ul>
                        </div>
                    </section>
                </article>
            `)
            render.availableTasks({ type: view })
        }
    }
}
function handleViewChange(e) {
    location.hash = `#/home?view=${e.target.value}`
}

router.addRoute('task', (state) => {
    const { params: { id } } = state;
    const [category] = id.split('_');
    if (floGlobals.isSubAdmin) {
        renderElem(getRef('app_body'), html`
            <article id="task">
                ${header()}
                <section class="grid gap-1">
                    <a href="#/home" class="button button--outlined margin-right-auto">Back</a>
                    <h2>Updates</h2>
                    <ul id="task_update_list" class="grid gap-1"></ul>
                </section>
            </article>
        `);
        const updates = (floGlobals.appObjects[category].tasks.find(task => task.id === id).updates || [])
            .map(updateVC => {
                const { message: { id, updateMessage, type }, senderID, time } = floDapps.getNextGeneralData('taskUpdates', '0')[updateVC];
                return html`    
                    <li class="update-card grid gap-0-3">
                        <div class="flex align-center space-between flex-wrap gap-0-3">
                            <div class="update-card__sender">${senderID}</div>
                            <time class="update-card__time">${getFormattedTime(time)}</time>
                        </div>
                        <div class="update-card__message">${updateMessage}</div>
                    </li>
                `
            }).reverse();
        if (updates.length) {
            renderElem(getRef('task_update_list'), html`${updates}`)
        } else {
            renderElem(getRef('task_update_list'), html`<li>No updates yet</li>`)
        }
    } else if (!floGlobals.isAdmin) {
    }
})

router.addRoute('profile', (state) => {
    try {
        const { } = state;
        let name = email = college = course = whatsappNumber = '';
        if (floGlobals.userProfile) {
            const userDetails = JSON.parse(floDapps.user.decipher(floGlobals.userProfile));
            name = userDetails.name;
            email = userDetails.email;
            college = userDetails.college;
            course = userDetails.course;
            whatsappNumber = userDetails.whatsappNumber;
        }
        renderElem(getRef('app_body'), html`
            <article id="profile">
                ${header()}
                <section class="flex gap-2 flex-wrap">
                    <div id="profile__header" class="flex flex-direction-column">
                        <h4>Tell us about</h4>
                        <h1>yourself</h1>
                    </div>
                    <sm-form id="profile__form">
                        <div class="flex flex-direction-column">
                            <label class="label" for="profile__name">Name</label>
                            <sm-input id="profile__name" value=${name} error-text="Please enter your name" maxlength="30" required></sm-input>
                        </div>
                        <div class="flex flex-direction-column">
                            <label class="label" for="profile__email">Email</label>
                            <sm-input id="profile__email" value=${email} type="email" error-text="Please enter your email" maxlength="40" required></sm-input>
                        </div>
                        <div class="flex flex-direction-column">
                            <label class="label" for="profile__whatsapp">WhatsApp number</label>
                            <sm-input id="profile__whatsapp_number" value=${whatsappNumber} minlength="10" maxlength="13" error-text="Please enter your whatsapp number" type="number" maxlength="10" required></sm-input>
                        </div>
                        <div class="flex flex-direction-column">
                            <label class="label" for="profile__college">College</label>
                            <sm-input id="profile__college" value=${college} error-text="Please enter your college name" maxlength="50" required></sm-input>
                        </div>
                        <div class="flex flex-direction-column">
                            <label class="label" for="profile__course">Course</label>
                            <sm-input id="profile__course" value=${course} error-text="Please enter your course" maxlength="30" required></sm-input>
                        </div>
                        <div class="multi-state-button">
                            <button id="profile__save" class="button button--primary" type="submit" onclick=${saveProfile}>
                                ${floGlobals.userProfile ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </sm-form>
                </section>   
            </article>
        `)
    }
    catch (err) {
        notify(err, 'error')
    }
})

router.addRoute('404', async () => {
    renderElem(getRef('app_body'), html`
        <article class="flex flex-direction-column align-center justify-center gap-1">
            <h1>404</h1>
            <h4>Page not found</h4>
        </article>
    `);
})

let privKeyResolver = null
function getSignedIn(passwordType) {
    return new Promise((resolve, reject) => {
        privKeyResolver = resolve
        try {
            getPromptInput('Enter password', '', {
                isPassword: true,
            }).then(password => {
                if (password) {
                    resolve(password)
                }
            })
        } catch (err) {
            floGlobals.isPrivKeySecured = passwordType === 'PIN/Password';
            if (!['#/landing', '#/sign_in', '#/sign_up'].some(route => window.location.hash.includes(route))) {
                history.replaceState(null, null, '#/landing')
                router.routeTo('#/landing')
            }
        }
    });
}
function setSecurePassword() {
    if (!floGlobals.isPrivKeySecured) {
        const password = getRef('secure_pwd_input').value.trim();
        floDapps.securePrivKey(password).then(() => {
            floGlobals.isPrivKeySecured = true;
            notify('Password set successfully', 'success');
            closePopup();
        }).catch(err => {
            notify(err, 'error');
        })
    }
}
function signOut() {
    getConfirmation('Sign out?', { message: 'You are about to sign out of the app, continue?', confirmText: 'Leave', cancelText: 'Stay' })
        .then(async (res) => {
            if (res) {
                await floDapps.clearCredentials();
                location.reload();
            }
        });
}
const btcAddresses = {}
const floAddresses = {}
function getBtcAddress(floAddress) {
    if (!btcAddresses[floAddress])
        btcAddresses[floAddress] = btcOperator.convert.legacy2bech(floAddress)
    return btcAddresses[floAddress]
}
function getFloAddress(btcAddress) {
    if (!floAddresses[btcAddress])
        floAddresses[btcAddress] = floCrypto.toFloID(btcAddress)
    return floAddresses[btcAddress]
}
router.routeTo('loading')
window.addEventListener("load", () => {
    const [browserName, browserVersion] = detectBrowser().split(' ');
    const supportedVersions = {
        Chrome: 85,
        Firefox: 75,
        Safari: 13,
    }
    if (browserName in supportedVersions) {
        if (parseInt(browserVersion) < supportedVersions[browserName]) {
            notify(`${browserName} ${browserVersion} is not fully supported, some features may not work properly. Please update to ${supportedVersions[browserName]} or higher.`, 'error')
        }
    } else {
        notify('Browser is not fully compatible, some features may not work. for best experience please use Chrome, Edge, Firefox or Safari', 'error')
    }
    document.body.classList.remove('hidden')
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            closePopup()
        }
    })
    document.addEventListener('copy', () => {
        notify('copied', 'success')
    })
    document.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button:not(:disabled), .interactive:not(:disabled)")) {
            createRipple(e, e.target.closest("button, .interactive"));
        }
    });
    const interestedCategories = localStorage.getItem('interestedCategories') || '[]';
    floGlobals.interestedCategories = new Set(JSON.parse(interestedCategories));
    floDapps.setMidStartup(() =>
        new Promise((resolve, reject) => {
            floCloudAPI.requestObjectData('rmInterns')
                .then(() => {
                    if (['#/landing', '#/sign_in', '#/sign_up'].some(route => window.location.hash.includes(route))) {
                        router.routeTo(window.location.hash);
                    }
                    resolve()
                }).catch(err => {
                    console.error(err)
                    reject()
                })
        })
    )
    floDapps.setCustomPrivKeyInput(getSignedIn)

    floDapps.launchStartUp().then(async result => {
        console.log(result)
        floGlobals.isUserLoggedIn = true
        floGlobals.myFloID = getFloAddress(floDapps.user.id);
        floGlobals.myBtcID = getBtcAddress(floGlobals.myFloID)
        floGlobals.isSubAdmin = floGlobals.subAdmins.includes(floGlobals.myFloID)
        floGlobals.isAdmin = floGlobals.myFloID === floGlobals.adminID
        try {
            if (floGlobals.isSubAdmin) {
                const promises = []

                await Promise.all(Object.keys(floGlobals.taskCategories).map(category => floCloudAPI.requestObjectData(category)))

                for (const category in floGlobals.taskCategories) {
                    if (!floGlobals.appObjects[category]) {
                        console.log('resetting', category)
                        floGlobals.appObjects[category] = {
                            tasks: [],
                        }
                        promises.push(floCloudAPI.resetObjectData(category))
                    }
                }
                promises.push(floCloudAPI.requestGeneralData('taskApplications'))
                promises.push(floCloudAPI.requestGeneralData('taskUpdates'))
                await Promise.all(promises)
                floGlobals.allAvailableTasks = new Set();
                for (const category in floGlobals.taskCategories) {
                    const tasks = floGlobals.appObjects[category].tasks || [];
                    tasks.forEach(task => floGlobals.allAvailableTasks.add(task.id))
                }
                const taskApplications = floDapps.getNextGeneralData('taskApplications', '0');
                floGlobals.applications = {}
                for (const application in taskApplications) {
                    const { message: { taskID }, senderID } = taskApplications[application];
                    if (!floGlobals.applications[taskID])
                        floGlobals.applications[taskID] = new Set()
                    floGlobals.applications[taskID].add(senderID)
                }
                const taskUpdates = floDapps.getNextGeneralData('taskUpdates', '0');
                for (const updateVC in taskUpdates) {
                    const { message: { id } } = taskUpdates[updateVC];
                    const [category] = id.split('_');
                    const task = floGlobals.appObjects[category].tasks.find(task => task.id === id)
                    if (!task) {
                        continue;
                    } else if (task && !task.updates) {
                        task.updates = [updateVC]
                    } else {
                        floGlobals.appObjects[category].tasks.find(task => task.id === id).updates.push(updateVC)
                    }
                }
            } else if (floGlobals.isAdmin) {

            } else {
                floGlobals.applications = new Set()
                const promises = [
                    floCloudAPI.requestGeneralData('taskApplications', {
                        senderID: [floGlobals.myFloID, floGlobals.myBtcID],
                    }),
                    floCloudAPI.requestGeneralData('userProfile', {
                        senderID: [floGlobals.myFloID, floGlobals.myBtcID],
                    }),
                    floCloudAPI.requestGeneralData('taskUpdates', {
                        senderID: [floGlobals.myFloID, floGlobals.myBtcID],
                    })
                ]
                await Promise.all(promises)
                const taskApplications = floDapps.getNextGeneralData('taskApplications', '0');
                floGlobals.allAvailableTasks = new Set();
                for (const category in floGlobals.taskCategories) {
                    const tasks = floGlobals.appObjects[category].tasks || [];
                    tasks.forEach(task => floGlobals.allAvailableTasks.add(task.id))
                }
                for (const application in taskApplications) {
                    const { message: { taskID } } = taskApplications[application];
                    // if the task is still available, add it to the applications
                    if (floGlobals.allAvailableTasks.has(taskID))
                        floGlobals.applications.add(taskID)
                }
                const userProfile = floDapps.getNextGeneralData('userProfile', '0');
                // remove general data which is not from the user
                for (const profile in userProfile) {
                    if (userProfile[profile].senderID !== floGlobals.myFloID)
                        delete userProfile[profile]
                }
                floGlobals.userProfile = Object.values(userProfile).at(-1)?.message.encryptedData;
            }
            if (['#/landing', '#/sign_in', '#/sign_up'].includes(window.location.hash)) {
                history.replaceState(null, null, '#/home')
                router.routeTo('home')
            } else {
                router.routeTo(window.location.hash)
            }
        } catch (err) {
            console.error(err)
        }
    }).catch(error => console.error(error))
});


// We can allow users to send updates regarding the task.
// handle task deadlines
// Add icons to the task categories
// handle applicants data securely (encrypted) and allow sub-admins to view them
// ability to save data of interns which are promising beyond 7 days
// ability to mark tasks which are delayed
// have unified view for all tasks in subadmin view
// stop user from sending multiple updates if previous update is not resolved