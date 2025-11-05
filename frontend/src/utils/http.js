import axios from 'axios';

export const isCanceledError = (error) => {
  return (
    error?.name === 'CanceledError' ||
    error?.code === 'ERR_CANCELED' ||
    (axios?.isCancel ? axios.isCancel(error) : false)
  );
};