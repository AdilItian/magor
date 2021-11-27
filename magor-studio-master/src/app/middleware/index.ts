import {
    handleBodyRequestParser,
    handleCompression,
    handleCors,
    handleHelmet,
    handleLogging
} from "./common";

export default [
    handleBodyRequestParser,
    handleCompression,
    handleCors,
    handleHelmet,
    handleLogging
];
