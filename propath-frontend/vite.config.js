import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
async function analyzeCV(file) {
  const formData = new FormData();
  formData.append("cv", file);

  const res = await fetch("http://localhost:3001/analyze", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  // data.summary → string
  // data.missingSkills → array of strings
  // data.courses → array of { title, platform, price, skill }
  // data.jobs → array of { title, match }
  console.log(data);
}