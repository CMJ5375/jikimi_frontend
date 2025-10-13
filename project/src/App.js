import './App.css';
import HospitalInfo from './component/HospitalInfo';
import KakaoMap from './component/KakaoMap';
import Main from './component/Main'
import Myfooter from './component/Myfooter';
import Navigation from './component/Navigation';

function App() {
  
  return (
    <>
    <KakaoMap />
    <Navigation/>
    <Main />
    <Myfooter />
    </>
  );
}

export default App;