import { useDispatch } from "react-redux";
import { useEffect } from "react";
import api from "../../utils/axios";
import { setUserdata } from "../redux/userSlice";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/api/me");
        dispatch(setUserdata(data));
      } catch (error) {
        if (error.response?.status === 400) return; // not logged in yet
        console.log(error);
      }
    };
    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
