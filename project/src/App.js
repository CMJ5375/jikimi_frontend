import './App.css';
import Main from './component/Main'
import Detail from './component/Detail';
import Myfooter from './component/Myfooter';
import Navigation from './component/Navigation';

function App() {
  
  return (
    <>
    <Navigation/>
    {/* <Main /> */}
    <Detail />
    <Myfooter />
    </>
  );
}

export default App;