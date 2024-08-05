<script lang="ts">

	// export let template: TemplateDescr<any> | null;
	type Status = 'success' | 'error';
	export let data: any = null;
	export let render: (data: string) => { value: string, status: Status };

	let status: Status;
	let value: string;
	({ value, status } = render(data));
</script>

<div class="card p-4 bg-white rounded shadow-md">
	<p class="text-secondary">
		<textarea>{JSON.stringify(data) ? data : ''}</textarea>
		<textarea>{value}</textarea>
	</p>
	{status}
</div>
