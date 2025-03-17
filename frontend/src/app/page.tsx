import BlogCardGroup from "@/components/blog-card-group";

// Access environment variable
console.log(process.env.NEXT_PUBLIC_API_URL)
// Fetch data from API
async function fetchData() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('API URL is not defined in environment variables');
      return;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Call the function
fetchData();

export default function Home() {
  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <BlogCardGroup />
    </div>
  )
}

