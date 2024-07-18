# react-footytips

## API Usage

- POST /api/refresh-data

### POST /api/refresh-data

Refresh the data in the DB from FanFooty resource

### Request

> #### Top-level
>
> | Field    | Type   | Description           |
> | -------- | ------ | --------------------- |
> | _secret_ | string | Refresh data password |

##### Example

```json
{
  "secret": "[PASSWORD]"
}
```
