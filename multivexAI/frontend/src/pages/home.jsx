import { signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { FcGoogle } from 'react-icons/fc';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../../utils/firebase';
import api from '../../utils/axios';
import { setUserdata } from '../redux/userSlice';

// --- NEW IMPORTS ---------------------------------------------------------
import SideBar from '../components/sidebar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
// -------------------------------------------------------------------------

function Home() {
  const { userData } = useSelector(state => state.user);
  const dispatch = useDispatch();

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      dispatch(setUserdata(data));
    } catch (error) {
      console.error("login failed:", error.response?.data ?? error.message);
    }
  };

  const googleLogin = async () => {
    const data = await signInWithPopup(auth, googleProvider);
    const token = await data.user.getIdToken();
    console.log(token);
    await handleLogin(token);
    console.log(data);
  };

  return (
    <div className='h-screen flex bg-[#0d0f15] text-white overflow-hidden'>

      <SideBar />
      <ChatArea />
      <Artifact />

      {!userData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
          <div className="w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5">
            <div className='flex flex-col gap-1'>
              <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>
                Welcome to MultivexAI
              </h2>
              <p className='text-[13px] text-slate-500'>
                Please login to continue using the app.
              </p>
              <button
                onClick={googleLogin}
                className='flex items-center gap-2 px-4 py-2 rounded bg-white text-black hover:bg-gray-200 transition'
              >
                <FcGoogle size={15} />
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;