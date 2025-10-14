import './App.css'
import { Routes, Route} from 'react-router-dom'
import Main from './component/Main'
import LoginMain from './component/LoginMain'
import Layout from './component/Layout'
import MyPage from './component/MyPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Main />} />
        <Route path='login' element={<LoginMain />} />
        <Route path='mypage' element={<MyPage />} />
      </Route>
    </Routes>
  )
}
