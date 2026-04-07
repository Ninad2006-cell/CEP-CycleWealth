import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabaseClient from "../supabase-config";

function Login() {
   const navigate = useNavigate();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   const handleLogin = async (e) => {
       e.preventDefault();
       setLoading(true);
       setError("");

       try {
           // Query the public.users table for authentication
           const { data, error } = await supabaseClient
               .from('users')
               .select('*')
               .eq('email_address', email)
               .eq('password', password)
               .single();

           if (error || !data) {
               throw new Error("Invalid email or password");
           }

           // Store user data in session (you might want to use a more secure method)
           sessionStorage.setItem('user', JSON.stringify(data));

           // Redirect based on role
           const userRole = data.role;
           
           if (userRole === "ScrapDealer") {
               navigate("/scrapdealer");
           } else {
               navigate("/dashboard");
           }
       } catch (error) {
           setError(error.message);
       } finally {
           setLoading(false);
       }
   };

   return(
    <div className="auth-container">
        <div className="card">
            <h2>Login</h2>
            
            {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

            <form onSubmit={handleLogin}>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    </div>
   );
}

export default Login;