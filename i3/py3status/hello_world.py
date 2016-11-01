# -*- coding: utf-8 -*-
"""
Example module that says 'Hello World!' that can be customised.

This demonstrates how to use configuration parameters.

Configuration parameters:
    format: Display format (default 'Hello World!')
"""


class Py3status:

    format = 'Hello World!'

    def hello_world(self):
        return {
            'full_text': self.format,
            'cached_until': self.py3.CACHE_FOREVER
        }
