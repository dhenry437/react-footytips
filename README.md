# react-footytips

## API Usage

- POST /api/get-data

### POST /api/get-data

Refresh the data in the DB from FanFooty resource

### Request

> #### Top-level
>
> | Field    | Type   | Description           |
> | -------- | ------ | --------------------- |
> | _secret_ | string | Refresh data password |

##### Example

```
{
    "secret": "[PASSWORD]"
}
```
