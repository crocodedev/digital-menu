// app/display/[slug]/page.tsx

'use client'

import { useEffect, useRef } from 'react'
import { useRealtimeMenu } from '../../../hooks/useRealtimeMenu'

export default function MenuPage({ params }: { params: { slug: string } }) {
  const { menu, loading, error } = useRealtimeMenu(params.slug)
  const scrollRef = useRef<HTMLDivElement>(null)

  // слушаем fullscreen из admin
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.action === 'fullscreen') {
        const el = document.documentElement
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // плавный автоскролл страницы с паузой в начале и конце
 useEffect(() => {
  if (!scrollRef.current) return
  const container = scrollRef.current
  let animationId: number
  const scrollSpeed = 0.5
  const pauseDuration = 2000
  let cancelled = false

  const smoothScrollTo = (target: number, callback?: () => void) => {
    const step = () => {
      if (cancelled) return
      const current = container.scrollTop
      const distance = target - current
      if (Math.abs(distance) <= scrollSpeed) {
        container.scrollTop = target
        if (callback) callback()
      } else {
        container.scrollTop = current + Math.sign(distance) * scrollSpeed
        animationId = requestAnimationFrame(step)
      }
    }
    step()
  }

  const startScrollCycle = () => {
    const maxScroll = container.scrollHeight - container.clientHeight

    const scrollDown = () => {
      smoothScrollTo(maxScroll, () => {
        if (cancelled) return
        setTimeout(scrollUp, pauseDuration)
      })
    }

    const scrollUp = () => {
      smoothScrollTo(0, () => {
        if (cancelled) return
        setTimeout(scrollDown, pauseDuration)
      })
    }

    setTimeout(scrollDown, pauseDuration)
  }

  const restartScroll = () => {
    cancelled = true
    cancelAnimationFrame(animationId)
    cancelled = false
    startScrollCycle()
  }

  startScrollCycle()

  // Перезапуск при смене Fullscreen
  const fullscreenHandler = () => restartScroll()
  document.addEventListener('fullscreenchange', fullscreenHandler)

  return () => {
    cancelled = true
    cancelAnimationFrame(animationId)
    document.removeEventListener('fullscreenchange', fullscreenHandler)
  }
}, [menu])



  if (loading) return <p className="text-center">loading...</p>
  if (error) return <p className="text-center text-red-500">Error: {String(error.message)}</p>
  if (!menu) return <p className="text-center">Menu not found</p>

  let containerStyle: React.CSSProperties = {}
  let containerClasses = 'w-screen h-screen p-6 transition-colors duration-300 overflow-hidden'

  if (menu.mode === 'dark') {
    containerClasses += ' bg-gray-900 text-white'
  } else if (menu.mode === 'light') {
    containerClasses += ' bg-white text-black'
  } else if (menu.mode === 'brand') {
    containerStyle = {
      backgroundColor: menu.brand_background,
      color: menu.brand_text,
    }
  }

  return (
    <div className={containerClasses} style={containerStyle} ref={scrollRef}>
      <header className="flex items-center gap-4 mb-6">
        {menu.logo_path && <img src={menu.logo_path} alt="logo" className="h-16 w-16 rounded-full" />}
        <h1 className="text-5xl font-bold">{menu.name}</h1>
      </header>

      {menu.menu_sections
        .filter((s) => s.visible)
        .sort((a, b) => a.position - b.position)
        .map((section) => (
          <div key={section.id} className="mb-12">
            <h2 className="text-4xl font-semibold mb-4">{section.title}</h2>
            <ul className="space-y-4 text-2xl">
              {section.menu_items
                .filter((i) => i.visible)
                .map((item) => (
                  <li key={item.id} className="flex justify-between border-b border-gray-400/30 pb-3">
                    <div>
                      <span>
                        {item.name}{' '}
                        {item.is_featured && <span className="ml-2 text-yellow-400">★</span>}
                        {item.is_trending && <span className="ml-2 text-pink-400">🔥</span>}
                      </span>
                      {item.description && <p className="text-base">{item.description}</p>}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-1 flex gap-2 flex-wrap">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span>${item.price.toFixed(2)}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
    </div>
  )
}


// // app/display/[slug]/page.tsx

// 'use client'

// import { useEffect } from 'react'
// import { useRealtimeMenu } from '../../../hooks/useRealtimeMenu'

// export default function MenuPage({ params }: { params: { slug: string } }) {
//   const { menu, loading, error } = useRealtimeMenu(params.slug)

//   // слушаем fullscreen из admin
//   useEffect(() => {
//     const handler = (e: MessageEvent) => {
//       if (e.data?.action === 'fullscreen') {
//         const el = document.documentElement
//         if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
//       }
//     }
//     window.addEventListener('message', handler)
//     return () => window.removeEventListener('message', handler)
//   }, [])

//   if (loading) return <p className="text-center">loading...</p>
//   if (error) return <p className="text-center text-red-500">Error: {String(error.message)}</p>
//   if (!menu) return <p className="text-center">Menu not found</p>

//   let containerStyle: React.CSSProperties = {}
//   let containerClasses = 'w-screen h-screen p-6 transition-colors duration-300'

//   if (menu.mode === 'dark') {
//     containerClasses += ' bg-gray-900 text-white'
//   } else if (menu.mode === 'light') {
//     containerClasses += ' bg-white text-black'
//   } else if (menu.mode === 'brand') {
//     containerStyle = {
//       backgroundColor: menu.brand_background,
//       color: menu.brand_text,
//     }
//   }

//   return (
//     <div className={containerClasses} style={containerStyle}>
//       <header className="flex items-center gap-4 mb-6">
//         {menu.logo_path && <img src={menu.logo_path} alt="logo" className="h-16 w-16 rounded-full" />}
//         <h1 className="text-5xl font-bold">{menu.name}</h1>
//       </header>

//       {menu.menu_sections
//         .filter((s) => s.visible)
//         .sort((a, b) => a.position - b.position)
//         .map((section) => (
//           <div key={section.id} className="mb-12">
//             <h2 className="text-4xl font-semibold mb-4">{section.title}</h2>
//             <ul className="space-y-4 text-2xl">
//               {section.menu_items
//                 .filter((i) => i.visible)
//                 .map((item) => (
//                   <li key={item.id} className="flex justify-between border-b border-gray-400/30 pb-3">
//                     <div>
//                       <span>
//                         {item.name}{' '}
//                         {item.is_featured && <span className="ml-2 text-yellow-400">★</span>}
//                         {item.is_trending && <span className="ml-2 text-pink-400">🔥</span>}
//                       </span>
//                       {item.description && <p className="text-base">{item.description}</p>}
//                       {item.tags && item.tags.length > 0 && (
//                         <div className="mt-1 flex gap-2 flex-wrap">
//                           {item.tags.map((tag) => (
//                             <span
//                               key={tag}
//                               className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full"
//                             >
//                               {tag}
//                             </span>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                     <span>${item.price.toFixed(2)}</span>
//                   </li>
//                 ))}
//             </ul>
//           </div>
//         ))}
//     </div>
//   )
// }
