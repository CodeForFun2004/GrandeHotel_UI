import axios from "axios";
import { LOGIN_USER } from "./../utils/constant/enum";

// 
// http://localhost:8080
export const BASE_URL = "https://lawohbe.onrender.com"
// cấu hình mang tiếng là nâng cao, nhma mình sẽ tận dụng cái nâng cao này cho nó lỏ lỏ xíu 
export const axiosInstance = axios.create({
   baseURL: `${BASE_URL}`,
});

// Add a request interceptor to include the Bearer token in all requests
axiosInstance.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem(LOGIN_USER);
      if (token) {
         config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
   },
   (error) => Promise.reject(error)
);
// acesstoken / resetToken / 7d
// Function to extend the token when expired
// const extendToken = async () => {
//    try {
//       const { data } = await axiosInstance.post(
//          `/auth/extend-token`,
//          {},
//          { withCredentials: true }
//       );
//       return data?.newAccessToken; // Return the new access token
//    } catch{
   
//    }
// };

// // Add a response interceptor to handle token renewal on 401 responses
// axiosInstance.interceptors.response.use(
//    (response: any) => response, // Pass successful responses through
//    async (error:any) => {
//       const originalRequest = error.config;
//       if (error.response?.status === 401 && !originalRequest._retry) {
//          originalRequest._retry = true; // Avoid infinite retries
//          try {
//             const newAccessToken = await extendToken();
//             if (newAccessToken) {
//                localStorage.setItem(LOGIN_USER, newAccessToken); // Save new token
//                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
//                return axiosInstance(originalRequest); // Retry the original request
//             }
//          } catch (err) {
//             console.log("Token renewal failed:", err);
//          }
//       }

//       return Promise.reject(error); // Reject other errors
//    }
// );

// // Fetch generic data from the API
// export const fetchFromAPI = async (url:any) => {
//    try {
//       const { data } = await axiosInstance.get(url);
//       return data;
//    } catch (error) {
//       console.error("Error fetching from API:", error);
//       throw error;
//    }
// };