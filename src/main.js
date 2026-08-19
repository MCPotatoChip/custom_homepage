import './style.css'

const NASA_KEY = import.meta.env.VITE_NASA_API_KEY

// ── shortcuts: what you see by default on the first visit ─────────────────────
const DEFAULT_SHORTCUTS = [
  { id: 'yt', label: 'YouTube',   url: 'https://youtube.com'       },
  { id: 'ig', label: 'Instagram', url: 'https://instagram.com'     },
  { id: 'fb', label: 'Facebook',  url: 'https://facebook.com'      },
  { id: 'wa', label: 'WhatsApp',  url: 'https://web.whatsapp.com'  },
  { id: 'x',  label: 'X',         url: 'https://twitter.com'       },
  { id: 'rd', label: 'Reddit',    url: 'https://reddit.com'        },
  { id: 'gh', label: 'GitHub',    url: 'https://github.com'        },
  { id: 'gm', label: 'Gmail',     url: 'https://gmail.com'         },
]

// ── grab all the elements we'll be working with ───────────────────────────────
const bgEl          = document.getElementById('bg')
const clockEl       = document.getElementById('clock')
const dateEl        = document.getElementById('date')
const loadingEl     = document.getElementById('loading-overlay')
const searchBlock   = document.getElementById('search-block')
const searchForm    = document.getElementById('search-form')
const searchInput   = document.getElementById('search-input')
const shortcutsGrid = document.getElementById('shortcuts-grid')
const editBtn       = document.getElementById('edit-btn')
const doneBtn       = document.getElementById('done-btn')
const addBtn        = document.getElementById('add-btn')
const addForm       = document.getElementById('add-form')
const addUrlInput   = document.getElementById('add-url')
const addLabelInput = document.getElementById('add-label')
const cancelAddBtn  = document.getElementById('cancel-add')
const scrollHint    = document.getElementById('scroll-hint')
const newsSliderContent = document.getElementById('news-slider-content')
const newsPrevBtn        = document.getElementById('news-prev-btn')
const newsNextBtn        = document.getElementById('news-next-btn')

// ── clock ─────────────────────────────────────────────────────────────────────

// runs every second to keep the time up to date
function tick() {
  const now = new Date()
  const h   = String(now.getHours()).padStart(2, '0')
  const m   = String(now.getMinutes()).padStart(2, '0')
  clockEl.textContent = `${h}:${m}`

  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── search bar ────────────────────────────────────────────────────────────────

function initSearch() {
  // expand the whole block when the user clicks into the search bar
  searchInput.addEventListener('focus', () => {
    searchBlock.classList.add('focused')
  })

  // shrink back after they leave (small delay to avoid flicker when clicking submit)
  searchInput.addEventListener('blur', () => {
    setTimeout(() => searchBlock.classList.remove('focused'), 200)
  })

  // send to google when they hit enter
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const q = searchInput.value.trim()
    if (q) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`
  })
}

// ── shortcuts ─────────────────────────────────────────────────────────────────

// read from localstorage, fall back to defaults if nothing saved yet
function getShortcuts() {
  try {
    const saved = localStorage.getItem('shortcuts')
    return saved ? JSON.parse(saved) : [...DEFAULT_SHORTCUTS]
  } catch {
    return [...DEFAULT_SHORTCUTS]
  }
}

function saveShortcuts(list) {
  localStorage.setItem('shortcuts', JSON.stringify(list))
}

// pull just the hostname out of a url — "https://notion.so/page" → "notion.so"
function getDomain(url) {
  try {
    const full = url.startsWith('http') ? url : 'https://' + url
    return new URL(full).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// google's favicon service gives us a nice icon for any site
function faviconUrl(url) {
  return `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=64`
}

// build the shortcut elements and put them in the grid
function renderShortcuts() {
  const list = getShortcuts()
  shortcutsGrid.innerHTML = ''

  list.forEach(sc => {
    const a = document.createElement('a')
    a.className   = 'shortcut'
    a.href        = sc.url
    a.target      = '_blank'
    a.rel         = 'noopener'
    a.dataset.id  = sc.id

    // ✕ button that appears in edit mode
    const removeBtn = document.createElement('button')
    removeBtn.className   = 'shortcut-remove'
    removeBtn.textContent = '✕'
    removeBtn.title       = `remove ${sc.label}`
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      removeShortcut(sc.id)
    })

    // the favicon box
    const iconBox = document.createElement('span')
    iconBox.className = 'shortcut-icon'

    const img = document.createElement('img')
    img.src   = faviconUrl(sc.url)
    img.alt   = sc.label
    img.width  = 26
    img.height = 26
    // if the favicon fails, just show the first letter of the site name
    img.onerror = () => {
      img.remove()
      iconBox.textContent = sc.label[0].toUpperCase()
    }

    iconBox.appendChild(img)

    // label under the icon
    const label = document.createElement('span')
    label.className   = 'shortcut-label'
    label.textContent = sc.label

    a.append(removeBtn, iconBox, label)
    shortcutsGrid.appendChild(a)
  })
}

function removeShortcut(id) {
  const updated = getShortcuts().filter(sc => sc.id !== id)
  saveShortcuts(updated)
  renderShortcuts()
  shortcutsGrid.classList.add('editing') // stay in edit mode after removing
}

// switch into edit mode — shows the wobble and ✕ buttons
function enterEditMode() {
  shortcutsGrid.classList.add('editing')
  editBtn.classList.add('hidden')
  doneBtn.classList.remove('hidden')
  addBtn.classList.remove('hidden')
}

function exitEditMode() {
  shortcutsGrid.classList.remove('editing')
  doneBtn.classList.add('hidden')
  addBtn.classList.add('hidden')
  addForm.classList.add('hidden')
  editBtn.classList.remove('hidden')
  addUrlInput.value   = ''
  addLabelInput.value = ''
}

function initShortcuts() {
  editBtn.addEventListener('click', enterEditMode)
  doneBtn.addEventListener('click', exitEditMode)

  // toggle the add form when clicking "+ add"
  addBtn.addEventListener('click', () => {
    addForm.classList.toggle('hidden')
    if (!addForm.classList.contains('hidden')) addUrlInput.focus()
  })

  cancelAddBtn.addEventListener('click', () => {
    addForm.classList.add('hidden')
    addUrlInput.value   = ''
    addLabelInput.value = ''
  })

  // auto-suggest the site name as a label while the user types the url
  addUrlInput.addEventListener('input', () => {
    if (addLabelInput.value) return // don't overwrite if they already typed something
    const domain = getDomain(addUrlInput.value)
    if (domain && domain !== addUrlInput.value) {
      const name = domain.split('.')[0]
      addLabelInput.placeholder = name.charAt(0).toUpperCase() + name.slice(1)
    }
  })

  addForm.addEventListener('submit', (e) => {
    e.preventDefault()
    let url = addUrlInput.value.trim()
    if (!url) return

    // make sure there's a protocol
    if (!url.startsWith('http')) url = 'https://' + url

    const domain = getDomain(url)
    const name   = domain.split('.')[0]
    const label  = addLabelInput.value.trim() ||
                   (name.charAt(0).toUpperCase() + name.slice(1))

    const updated = getShortcuts()
    updated.push({ id: String(Date.now()), label, url })
    saveShortcuts(updated)
    renderShortcuts()

    // stay in edit mode, clear the form
    shortcutsGrid.classList.add('editing')
    addUrlInput.value       = ''
    addLabelInput.value     = ''
    addLabelInput.placeholder = 'label'
    addForm.classList.add('hidden')
  })
}

// ── scroll hint ───────────────────────────────────────────────────────────────

function initScrollHint() {
  // clicking the arrow smoothly scrolls down to the news section
  scrollHint.addEventListener('click', () => {
    document.getElementById('news-section').scrollIntoView({ behavior: 'smooth' })
  })
}

// ── tech news from dev.to ─────────────────────────────────────────────────────

let currentNewsIndex = 0
let newsArticles = []

// we cache for 30 minutes so we don't hit the api on every single tab open
const NEWS_URL      = 'https://dev.to/api/articles?per_page=15&top=1'
const CACHE_KEY     = 'news_cache'
const CACHE_MINUTES = 30
const CACHE_TTL     = CACHE_MINUTES * 60 * 1000

async function loadNews() {
  // check if we have a recent enough cache
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      newsArticles = cached.data
      initNewsSlider()
      return
    }
  } catch { /* cache was broken, just refetch */ }

  try {
    const res      = await fetch(NEWS_URL)
    if (!res.ok) throw new Error('bad response')
    newsArticles = await res.json()

    // save to session cache
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: newsArticles }))
    initNewsSlider()
  } catch (err) {
    console.warn('could not load news:', err)
    newsSliderContent.innerHTML = '<p class="news-error">couldn\'t load news right now — try again later.</p>'
  }
}

function initNewsSlider() {
  if (!newsArticles || newsArticles.length === 0) {
    newsSliderContent.innerHTML = '<p class="news-error">no news available right now.</p>'
    return
  }

  // Set up event listeners for arrows
  newsPrevBtn.addEventListener('click', showPrevArticle)
  newsNextBtn.addEventListener('click', showNextArticle)

  // Render the initial article
  renderArticle(currentNewsIndex)
}

function showPrevArticle() {
  if (newsArticles.length === 0) return
  currentNewsIndex = (currentNewsIndex - 1 + newsArticles.length) % newsArticles.length
  renderArticle(currentNewsIndex)
}

function showNextArticle() {
  if (newsArticles.length === 0) return
  currentNewsIndex = (currentNewsIndex + 1) % newsArticles.length
  renderArticle(currentNewsIndex)
}

function renderArticle(index) {
  const article = newsArticles[index]
  if (!article) return

  // Create card
  const card = document.createElement('a')
  card.className = 'news-card'
  card.href      = article.url
  card.target    = '_blank'
  card.rel       = 'noopener'

  // cover image (or a gradient placeholder if there isn't one)
  const imgDiv = document.createElement('div')
  imgDiv.className = 'news-img'
  if (article.cover_image) {
    imgDiv.style.backgroundImage = `url("${article.cover_image}")`
  } else {
    imgDiv.classList.add('no-img')
  }

  const body = document.createElement('div')
  body.className = 'news-body'

  // first tag shown as a small chip
  if (article.tag_list?.length) {
    const tag = document.createElement('span')
    tag.className   = 'news-tag'
    tag.textContent = article.tag_list[0]
    body.appendChild(tag)
  }

  const title = document.createElement('h3')
  title.className   = 'news-title'
  title.textContent = article.title

  const raw  = article.description || ''
  const desc = document.createElement('p')
  desc.className   = 'news-desc'
  desc.textContent = raw.length > 150 ? raw.slice(0, 150) + '…' : raw

  const meta = document.createElement('span')
  meta.className   = 'news-meta'
  meta.textContent = `${article.user.name} · ${article.reading_time_minutes} min read`

  body.append(title, desc, meta)
  card.append(imgDiv, body)

  // Clear previous content and append card
  newsSliderContent.innerHTML = ''
  newsSliderContent.appendChild(card)

  // Trigger CSS transition
  requestAnimationFrame(() => {
    card.classList.add('active')
  })
}


// ── nasa apod background ──────────────────────────────────────────────────────

async function loadBackground() {
  try {
    const res  = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`)
    if (!res.ok) throw new Error('apod failed')
    const data = await res.json()

    let imageUrl = null

    if (data.media_type === 'image') {
      imageUrl = data.hdurl || data.url
    } else if (data.media_type === 'video') {
      // for youtube videos we grab the thumbnail instead
      const match = data.url.match(/youtube\.com\/embed\/([^?&]+)/)
      if (match) imageUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    }

    if (imageUrl) {
      // preload the image before showing it so there's no flash
      const img    = new Image()
      img.onload   = () => { bgEl.style.backgroundImage = `url("${imageUrl}")`; bgEl.classList.add('loaded'); revealPage() }
      img.onerror  = () => { bgEl.classList.add('loaded'); revealPage() }
      img.src      = imageUrl
    } else {
      bgEl.classList.add('loaded')
      revealPage()
    }
  } catch {
    // if the api is down just show the dark background
    bgEl.classList.add('loaded')
    revealPage()
  }
}

// fade out the loading screen
function revealPage() {
  loadingEl.classList.add('fade-out')
  setTimeout(() => loadingEl.remove(), 1100)
}

// ── start everything ──────────────────────────────────────────────────────────

tick()
setInterval(tick, 1000)

initSearch()
renderShortcuts()
initShortcuts()
initScrollHint()

loadBackground()
loadNews()
