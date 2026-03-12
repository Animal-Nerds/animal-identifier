<script>
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

    function onclick() {
        auth.login('test@email.com');
        goto('/');
    }
</script>

<svelte:head>
	<title>Login - Animal Identifier</title>
</svelte:head>

<center>
    <br /><br /><br />
    <button onclick={onclick}>Trigger Fake Sign In</button>
</center>