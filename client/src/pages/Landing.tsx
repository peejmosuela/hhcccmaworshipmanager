import { useState } from "react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const submit = async () => {
    const res = await fetch(isRegister ? "/api/register" : "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) location.reload();
    else alert("Error");
  };

  return (
    <div style={{ maxWidth: 300, margin: "100px auto", textAlign: "center" }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} /><br/><br/>
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br/><br/>
      <button onClick={submit}>{isRegister ? "Register" : "Login"}</button>
      <p><a onClick={() => setIsRegister(!isRegister)} style={{cursor:"pointer", color:"blue"}}>
        {isRegister ? "Already have account? Login" : "No account? Register"}
      </a></p>
    </div>
  );
}
