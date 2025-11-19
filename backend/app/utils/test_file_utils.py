import os
import io
import tempfile
import pytest
from flask import request
from werkzeug.datastructures import FileStorage
from app.utils import file_utils


def test_allowed_file_pdf():
    assert file_utils.allowed_file('test.pdf')
    assert not file_utils.allowed_file('test.txt')
    assert not file_utils.allowed_file('test')
    assert not file_utils.allowed_file('test.PDFX')
    assert file_utils.allowed_file('test.PDF'.lower())


def test_handle_file_upload_valid(monkeypatch, app):
    test_filename = 'sample.pdf'
    test_content = b'PDF content here'
    data = {
        'file': (io.BytesIO(test_content), test_filename)
    }
    
    with app.test_request_context('/upload', method='POST', data=data, content_type='multipart/form-data'):
        filepath, error = file_utils.handle_file_upload(request, upload_folder=app.config['UPLOAD_FOLDER'])
        assert error is None
        assert filepath is not None
        assert os.path.exists(filepath)
        with open(filepath, 'rb') as f:
            assert f.read() == test_content
        os.remove(filepath)


def test_handle_file_upload_no_file(app):
    with app.test_request_context('/upload', method='POST', data={}, content_type='multipart/form-data'):
        filepath, error = file_utils.handle_file_upload(request, upload_folder=app.config['UPLOAD_FOLDER'])
        assert filepath is None
        assert error is not None
        resp, code = error
        assert code == 400
        assert 'No file uploaded' in resp.get_json()['error']


def test_handle_file_upload_invalid_extension(app):
    data = {
        'file': (io.BytesIO(b'not a pdf'), 'badfile.txt')
    }
    with app.test_request_context('/upload', method='POST', data=data, content_type='multipart/form-data'):
        filepath, error = file_utils.handle_file_upload(request, upload_folder=app.config['UPLOAD_FOLDER'])
        assert filepath is None
        assert error is not None
        resp, code = error
        assert code == 400
        assert 'Invalid file' in resp.get_json()['error']
