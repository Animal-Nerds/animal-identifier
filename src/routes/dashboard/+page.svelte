<script>
	// your script goes here
	let { data } = $props();
	function handleLogout() {}
</script>

<section>
	<h1>hello {data.email}</h1>
	<button onclick={handleLogout}>Logout placeholder</button>
	<p>sighting will appear here</p>
</section>
