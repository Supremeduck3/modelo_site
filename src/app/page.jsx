"use client"

import Header from "@/components/Header"
import {Menu} from 'antd'
const items = [
  {key: '1', label:'Home'}
]
export default function page() {
  return (
    <main>
      <Header/>
       <div>teste</div>
       <Menu items={items}/>
    </main>
  )
}
