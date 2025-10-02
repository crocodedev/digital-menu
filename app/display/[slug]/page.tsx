// app/display/[slug]/page.txt

'use client'

import { useEffect } from 'react'
import { usePollingMenu } from '../../../hooks/usePollingMenu'

export default function MenuPage({ params }: { params: { slug: string } }) {
  const { menu, loading, error } = usePollingMenu(params.slug, 5000)

  // Входим в fullscreen при монтировании
  useEffect(() => {
    const enterFullscreen = () => {
      const el = document.documentElement
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    }
    enterFullscreen()
  }, [])

  if (loading) return <p className="text-center">loading...</p>
  if (error) return <p className="text-center text-red-500">Error: {String(error.message)}</p>
  if (!menu) return <p className="text-center">Menu not found</p>

  // Определяем стили темы
  let containerStyle: React.CSSProperties = {}
  let containerClasses = "w-screen h-screen p-6 transition-colors duration-300"

  if (menu.mode === 'dark') {
    containerClasses += " bg-gray-900 text-white"
  } else if (menu.mode === 'light') {
    containerClasses += " bg-white text-black"
  } else if (menu.mode === 'brand') {
    containerStyle = {
      backgroundColor: menu.brand_background,
      color: menu.brand_text,
    }
  }

  return (
    <div className={containerClasses} style={containerStyle}>
      <header className="flex items-center gap-4 mb-6">
        {menu.logo_path && (
          <img
            src={menu.logo_path}
            alt="logo"
            className="h-16 w-16 rounded-full"
          />
        )}
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
                  <li
                    key={item.id}
                    className="flex justify-between border-b border-gray-400/30 pb-3"
                  >
                    <span>
                      {item.name}{' '}
                      {item.is_featured && (
                        <span className="ml-2 text-yellow-400">★</span>
                      )}
                      {item.is_trending && (
                        <span className="ml-2 text-pink-400">🔥</span>
                      )}
                    </span>
                    <span>${item.price.toFixed(2)}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
    </div>
  )
}

// 'use client'

// import { usePollingMenu } from '../../../hooks/usePollingMenu'

// export default function MenuPage({ params }: { params: { slug: string } }) {
//   const { menu, loading, error } = usePollingMenu(params.slug, 5000)

//   if (loading) return <p className="text-center">loading...</p>
//   if (error) return <p className="text-center text-red-500">Error: {String(error.message)}</p>
//   if (!menu) return <p className="text-center">Menu not found</p>

//   // Определяем стили темы
//   let containerStyle: React.CSSProperties = {}
//   let containerClasses = "min-h-screen p-6 transition-colors duration-300"

//   if (menu.mode === 'dark') {
//     containerClasses += " bg-gray-900 text-white"
//   } else if (menu.mode === 'light') {
//     containerClasses += " bg-white text-black"
//   } else if (menu.mode === 'brand') {
//     containerStyle = {
//       backgroundColor: menu.brand_background,
//       color: menu.brand_text,
//     }
//   }

//   return (
//     <div className={containerClasses} style={containerStyle}>
//       <header className="flex items-center gap-4 mb-6">
//         {menu.logo_path && (
//           <img
//             src={menu.logo_path}
//             alt="logo"
//             className="h-12 w-12 rounded-full"
//           />
//         )}
//         <h1 className="text-3xl font-bold">{menu.name}</h1>
//       </header>

//       {menu.menu_sections
//         .filter((s) => s.visible)
//         .sort((a, b) => a.position - b.position)
//         .map((section) => (
//           <div key={section.id} className="mb-8">
//             <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>
//             <ul className="space-y-2">
//               {section.menu_items
//                 .filter((i) => i.visible)
//                 .map((item) => (
//                   <li
//                     key={item.id}
//                     className="flex justify-between border-b border-gray-400/30 pb-2"
//                   >
//                     <span>
//                       {item.name}{' '}
//                       {item.is_featured && (
//                         <span className="ml-2 text-yellow-400">★</span>
//                       )}
//                       {item.is_trending && (
//                         <span className="ml-2 text-pink-400">🔥</span>
//                       )}
//                     </span>
//                     <span>${item.price.toFixed(2)}</span>
//                   </li>
//                 ))}
//             </ul>
//           </div>
//         ))}
//     </div>
//   )
// }
