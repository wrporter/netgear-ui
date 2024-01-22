import { Button, Input } from '@nextui-org/react';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useActionData, useSearchParams } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import * as React from 'react';
import { AuthorizationError } from 'remix-auth';
import { ValidatedForm, useFormContext, validationError } from 'remix-validated-form';
import { z } from 'zod';

import { authenticator } from '~/auth.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
    return authenticator.isAuthenticated(request, {
        successRedirect: '/',
    });
};

const validator = withZod(
    z.object({
        password: z.string().min(1, { message: 'Please enter a password.' }),
        redirectTo: z.string(),
    }),
);

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const form = await validator.validate(formData);
    if (form.error) {
        return validationError(form.error);
    }
    const { redirectTo } = form.data;

    try {
        return await authenticator.authenticate('basic', request, {
            successRedirect: redirectTo,
            context: { formData },
        });
    } catch (error) {
        if (error instanceof Response) return error;
        if (error instanceof AuthorizationError) {
            return json({ passwordFailure: 'Invalid password.' }, { status: 401 });
        }
        throw error;
    }
};

export const meta: MetaFunction = () => [{ title: 'Netgear UI: Login' }];

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/';
    const form = useFormContext('loginForm');
    const actionData = useActionData<{ passwordFailure?: string }>();

    return (
        <>
            <h2 className="mb-6 text-center text-4xl">Log in</h2>

            <div className="mx-auto w-full max-w-md rounded bg-background px-8 py-8 drop-shadow-lg">
                <ValidatedForm
                    id="loginForm"
                    validator={validator}
                    method="post"
                    className="flex flex-col gap-6"
                    noValidate
                >
                    <div>
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            aria-describedby="password-error"
                        />
                        {form.fieldErrors.password && (
                            <div className="pt-1 text-red-700" id="password-error">
                                {form.fieldErrors.password}
                            </div>
                        )}

                        {actionData?.passwordFailure && (
                            <div className="pt-1 text-red-700">{actionData.passwordFailure}</div>
                        )}
                    </div>

                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <Button type="submit" color="primary" className="w-full">
                        Log in
                    </Button>
                </ValidatedForm>
            </div>
        </>
    );
}
