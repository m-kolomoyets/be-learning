import type { Handler } from '../lib/types.ts';
import { ONE_SECOND } from '../lib/constants.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';
import { sleep } from '../lib/utils/sleep.ts';

const EXTERNAL_API_URL = 'https://jsonplaceholder.typicode.com';

type User = {
    id: number;
    name: string;
    username: string;
    email: string;
};

const transformUsers = <TExternalUser extends User>(user: TExternalUser): User => {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
    };
};

export const externalUsersHandler: Handler = async (req, res) => {
    const signal = req.abortSignal ?? req.signal;

    await sleep(6 * ONE_SECOND, signal);

    const response = await fetch(`${EXTERNAL_API_URL}/users`, { signal, method: 'GET' });

    if (!response.ok) {
        sendResponse(res, 400, {
            message: 'Users were not fetched',
        });
        return;
    }

    const users = (await response.json()) as User[];

    const transformedUsers = users.map(transformUsers);

    sendResponse(res, 200, {
        users: transformedUsers,
    });
};
