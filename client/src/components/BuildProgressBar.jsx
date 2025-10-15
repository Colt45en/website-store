import React, { useEffect, useState } from 'react'

export default function BuildProgressBar() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timer)
  }, [])
  if (!visible) return null
  return (
    <div className="build-progress-bar">
      <div className="build-progress-inner" />
    </div>
  )
}
