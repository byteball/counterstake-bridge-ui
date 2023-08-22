import { Button, Col, Input, Row } from "antd";
import { useRef, useState } from "react";

import appConfig from "appConfig";

export const SubscribeForm = () => {
	const btn = useRef();

	const [email, setEmail] = useState({ value: '', error: '', valid: false, status: 'pending', });

	const emailHandleChange = (ev) => {
		const value = ev.target.value.trim();

		if (value === '') {
			setEmail({
				value,
				error: '',
				valid: false,
				status: "pending"
			})
		} else {
			const valid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);

			setEmail({
				value,
				error: valid ? '' : 'Not valid',
				valid,
				status: "pending"
			});
		}
	}

	const submit = async () => {
		setEmail((e) => ({ ...e, status: "loading" }));

		let formData = new FormData();
		formData.append('fields[email]', email.value);
		formData.append('ml-submit', '1');
		formData.append('anticsrf', 'true');

		try {
			fetch(appConfig.SUBSCRIBE_FORM_URL, {
				method: 'POST',
				body: formData
			}, {
			}).then(async resData => {

				const res = await resData.json();

				if (res.success) {
					setEmail((e) => ({ ...e, status: "ok" }));
				} else {
					setEmail((e) => ({ ...e, status: "error", error: res.errors?.fields.email?.[0] || "Unknown error" }));
				}

			}).catch(err => {
				console.error(err);
				setEmail((e) => ({ ...e, status: "error", error: "Unknown error" }));
			});
		} catch (err) {
			console.error(err);
		}

	}

	const handleKeyPress = (ev) => {
		if (ev.key === "Enter") {
			btn.current.click();
		}
	}

	return (<div style={{ maxWidth: 500, margin: "0 auto" }}>
		<div onSubmitCapture={submit} style={{ marginBottom: 20 }}>
			<Row gutter={[10, 10]}>
				<Col flex="auto">
					<Input onKeyPress={handleKeyPress} type="email" disabled={email.status === "ok" || email.status === "loading"} name="fields[email]" status={email.value ? (email.error ? "error" : "success") : undefined} aria-label="email" aria-required="true" value={email.value} onChange={emailHandleChange} size="middle" placeholder="Email address" autoComplete="off" />
				</Col>
				<Col flex='100px'>
					<Button
						ref={btn}
						style={{ height: 40 }}
						onClick={submit}
						disabled={!email.value || !email.valid || email.status !== "pending"}
						size="middle"
						type="primary"
					>
						Subscribe
					</Button>
				</Col>
			</Row>

			<div style={{ fontSize: 16 }}>
				{email.status === "ok" ? <span style={{ color: "green" }}>You have successfully joined our subscriber list.</span> : null}
				{email.error ? <span style={{ color: "red" }}>{email.error}</span> : null}
			</div>
		</div>
	</div>)
}