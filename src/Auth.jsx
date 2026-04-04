import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Registration successful");
      setIsLogin(true);

    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password })
      });

      const data = await res.json();

      if (!data.success) {
        alert("Login failed");
        return;
      }

      const user = data.user;

      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/member/dashboard");
      }

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>{isLogin ? "Login" : "Register"}</h2>

      {!isLogin && (
        <>
          <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Phone" onChange={(e) => setPhone(e.target.value)} />
        </>
      )}

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={isLogin ? handleLogin : handleRegister}>
        {isLogin ? "Login" : "Create Account"}
      </button>

      <p onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Go to Register" : "Go to Login"}
      </p>
    </div>
  );
}

export default Auth;
