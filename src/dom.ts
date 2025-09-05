export function splitLetters(args: { selector?: string, el?: HTMLElement }): void {
  const { selector, el } = args
  const textWrapper = el || (selector ? document.querySelector(selector) : null)

  if (!textWrapper) {
    return
  }

  // Check if wrapper is already split
  if (textWrapper.querySelector('.word > .fx')) {
    return
  }

  const processTextNode = (node: ChildNode): void => {
    const content = node.nodeValue ?? ''
    const newContent = content.replace(/&[a-z]+;|<[^>]*>|\b\w\S*|\S/gi, (match) => {
      if (match.startsWith('<') && match.endsWith('>')) {
        return match
      } else if ((match.startsWith('&') && match.endsWith(';')) || match.length === 1) {
        return `<span class="fx">${match}</span>`
      } else {
        return `<span class='word'>${match.split('').map((character) => `<span class='fx'>${character}</span>`).join('')}</span>`
      }
    })

    if (node.parentNode) {
      const fragment = document.createDocumentFragment()
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = newContent
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      node.parentNode.replaceChild(fragment, node)
    }
  }

  const walkNodes = (node: ChildNode): void => {
    if (node.nodeType === 3) {
      processTextNode(node)
    } else if (node.nodeType === 1) {
      Array.from(node.childNodes).forEach(walkNodes)
    }
  }

  walkNodes(textWrapper)
}

export async function onElementVisible(args: {
  caller?: string
  selector: string
  onVisible: () => void
  onHidden?: () => void
}): Promise<{ close: () => void }> {
  const { selector, onVisible, onHidden } = args

  if (typeof IntersectionObserver === 'undefined') {
    console.warn('IntersectionObserver is not supported in this environment.')
    return { close: () => {} }
  }

  let intervalId: NodeJS.Timeout
  let isVisible = false
  const observer = new IntersectionObserver((entries, observer) => {
    const [entry] = entries
    if (entry?.isIntersecting && !isVisible) {
      isVisible = true
      onVisible()

      if (!onHidden) {
        observer.disconnect()
      }
    } else if (!entry?.isIntersecting && isVisible) {
      isVisible = false
      if (onHidden) {
        onHidden()
      }
    }
  }, {
    threshold: 0.01,
  })

  let count = 0
  const checkAndObserve = () => {
    if (typeof document === 'undefined') {
      console.warn('Document is not available, cannot observe element.')
      clearInterval(intervalId)
      return
    }

    const element = document.querySelector(selector)
    if (element) {
      observer.observe(element)
      clearInterval(intervalId)
    } else {
      count++
      if (count > 100) {
        clearInterval(intervalId)
      }
    }
  }

  intervalId = setInterval(checkAndObserve, 50)
  intervalId.unref?.()

  return {
    close: () => {
      observer.disconnect()
      clearInterval(intervalId)
    },
  }
}
