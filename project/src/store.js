import { configureStore } from '@reduxjs/toolkit'


const store = configureStore({
  reducer: {
     reducer: (state = {}, action) => state //임시 이거없으면 자꾸 에러메세지 뜸
    // 나중에 리듀서 추가 ex)loginSlice:loginSlice
  },
})

export default store
