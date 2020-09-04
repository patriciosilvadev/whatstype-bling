"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.apikey = exports.api = void 0;
var axios_1 = __importDefault(require("axios"));
exports.api = axios_1.default.create({
    baseURL: 'https://bling.com.br/Api/v2/'
});
exports.apikey = "d7fb799ac73083aff22972767514e828b1bb38d0f29b2ae4030eee22f07ce34e32b9c1f2";
exports.config = {
    headers: {
        'Content-Type': 'application/xml'
    },
    params: {}
};
