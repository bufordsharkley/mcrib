from functools import wraps

from flask import jsonify


def json_response_with_status(view_func):
    @wraps(view_func)
    def _wrapper(*args, **kwargs):
        try:
            response = view_func(*args, **kwargs)
            response['status'] = 'OK'
            return jsonify(response)
        except Exception as e:
            # TODO log it.
            # TODO abort(403) etc... with exception message
            if str(e):
                return jsonify({'status': str(e)})
            return jsonify({'status': 'BAD'})
    return _wrapper
